// src/core/auth/__tests__/tokenRefreshObserver.test.ts
// Testes do observer proativo de refresh de token.

import {
  createTokenRefreshObserver,
  decodeJwtExp,
} from '../tokenRefreshObserver';

function makeJwt(expSeconds: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({ sub: 'user', exp: expSeconds })).toString('base64');
  const signature = 'sig';
  return `${header}.${payload}.${signature}`;
}

function makeCallback(overrides: Partial<{
  expiresAt: number | null;
  refresh: () => Promise<boolean>;
  onExternalRefresh: () => void;
  onAuthLost: (r: string) => void;
}> = {}) {
  return {
    getExpiresAt: jest.fn(() => overrides.expiresAt ?? null),
    refresh: overrides.refresh ?? jest.fn().mockResolvedValue(true),
    onExternalRefresh: overrides.onExternalRefresh ?? jest.fn(),
    onAuthLost: overrides.onAuthLost ?? jest.fn(),
  };
}

describe('decodeJwtExp', () => {
  it('decodifica exp de JWT válido', () => {
    const expSeconds = Math.floor(Date.now() / 1000) + 3600;
    const token = makeJwt(expSeconds);
    expect(decodeJwtExp(token)).toBe(expSeconds * 1000);
  });

  it('retorna null para JWT malformado', () => {
    expect(decodeJwtExp('invalid')).toBeNull();
    expect(decodeJwtExp('a.b.c')).toBeNull();
  });
});

describe('createTokenRefreshObserver', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('inicializa inativo e clear() não faz nada antes de scheduleRefresh', () => {
    const observer = createTokenRefreshObserver();
    expect(observer.isActive).toBe(false);
    expect(() => observer.clear()).not.toThrow();
  });

  it('clear() depois de schedule volta a estado inativo', () => {
    const observer = createTokenRefreshObserver();
    const cb = makeCallback({ expiresAt: Date.now() + 100000 });
    observer.scheduleRefresh(cb);
    expect(observer.isActive).toBe(true);
    observer.clear();
    expect(observer.isActive).toBe(false);
  });

  it('aguarda JWT - 5min antes de chamar refresh', () => {
    const observer = createTokenRefreshObserver();
    const refresh = jest.fn().mockResolvedValue(true);
    const expAt = Date.now() + 10 * 60 * 1000; // 10 min
    const cb = makeCallback({ expiresAt: expAt, refresh });

    observer.scheduleRefresh(cb);

    expect(refresh).not.toHaveBeenCalled();

    // 4 min decorridos: ainda não
    jest.advanceTimersByTime(4 * 60 * 1000);
    expect(refresh).not.toHaveBeenCalled();

    // 5 min (TTL - 5min): dispara
    jest.advanceTimersByTime(1 * 60 * 1000);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('se expiresAt === null, NÃO agenda refresh e só listeners cuidam', () => {
    const observer = createTokenRefreshObserver();
    const refresh = jest.fn().mockResolvedValue(true);
    const cb = makeCallback({ expiresAt: null, refresh });

    observer.scheduleRefresh(cb);

    expect(refresh).not.toHaveBeenCalled();
    expect(observer.isActive).toBe(true);
  });

  it('em falha de refresh, tenta até MAX_REFRESH_ATTEMPTS antes de chamar onAuthLost', async () => {
    const observer = createTokenRefreshObserver();
    const refresh = jest.fn().mockResolvedValue(false);
    const onAuthLost = jest.fn();
    const expAt = Date.now() + 10 * 60 * 1000;
    const cb = makeCallback({ expiresAt: expAt, refresh, onAuthLost });

    observer.scheduleRefresh(cb);

    // Tentativa 1: agenda para TTL - 5min
    jest.advanceTimersByTime(5 * 60 * 1000);
    await Promise.resolve();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(onAuthLost).not.toHaveBeenCalled();

    // Tentativa 2: re-agendado com RETRY_DELAY (30s)
    jest.advanceTimersByTime(30 * 1000);
    await Promise.resolve();
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(onAuthLost).not.toHaveBeenCalled();

    // Tentativa 3
    jest.advanceTimersByTime(30 * 1000);
    await Promise.resolve();
    expect(refresh).toHaveBeenCalledTimes(3);
    expect(onAuthLost).toHaveBeenCalledWith('refresh-failed');
    expect(observer.isActive).toBe(false);
  });

  it('refresh bem-sucedido reseta attempts e re-agenda', async () => {
    const observer = createTokenRefreshObserver();
    const refresh = jest.fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const expAt = Date.now() + 10 * 60 * 1000;
    const cb = makeCallback({ expiresAt: expAt, refresh });

    observer.scheduleRefresh(cb);

    // Falha 1 (TTL - 5min)
    jest.advanceTimersByTime(5 * 60 * 1000);
    await Promise.resolve();
    expect(refresh).toHaveBeenCalledTimes(1);

    // Sucesso 2 (retry 30s)
    jest.advanceTimersByTime(30 * 1000);
    await Promise.resolve();
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(observer.isActive).toBe(true);
  });

  it('clear() cancela timer pendente', () => {
    const observer = createTokenRefreshObserver();
    const refresh = jest.fn().mockResolvedValue(true);
    const expAt = Date.now() + 10 * 60 * 1000;
    const cb = makeCallback({ expiresAt: expAt, refresh });

    observer.scheduleRefresh(cb);
    observer.clear();

    jest.advanceTimersByTime(10 * 60 * 1000);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('exceção em refresh conta como falha', async () => {
    const observer = createTokenRefreshObserver();
    const refresh = jest.fn().mockRejectedValue(new Error('network'));
    const onAuthLost = jest.fn();
    const expAt = Date.now() + 10 * 60 * 1000;
    const cb = makeCallback({ expiresAt: expAt, refresh, onAuthLost });

    observer.scheduleRefresh(cb);

    // TTL - 5min: dispara 1a tentativa
    jest.advanceTimersByTime(5 * 60 * 1000);
    await Promise.resolve();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(onAuthLost).not.toHaveBeenCalled();

    // Retry 30s: dispara 2a tentativa
    jest.advanceTimersByTime(30 * 1000);
    await Promise.resolve();
    expect(onAuthLost).not.toHaveBeenCalled();

    // Retry 30s: dispara 3a tentativa → onAuthLost
    jest.advanceTimersByTime(30 * 1000);
    await Promise.resolve();
    expect(onAuthLost).toHaveBeenCalledWith('refresh-failed');
  });
});

describe('createTokenRefreshObserver — Web (visibility + storage)', () => {
  let visibilityListeners: (() => void)[] = [];
  let storageListeners: ((e: any) => void)[] = [];

  beforeEach(() => {
    visibilityListeners = [];
    storageListeners = [];
    jest.useFakeTimers();

    (global as any).document = {
      addEventListener: (event: string, cb: any) => {
        if (event === 'visibilitychange') visibilityListeners.push(cb);
      },
      removeEventListener: (event: string, cb: any) => {
        if (event === 'visibilitychange') {
          visibilityListeners = visibilityListeners.filter((l) => l !== cb);
        }
      },
      visibilityState: 'hidden',
    };
    (global as any).window = {
      addEventListener: (event: string, cb: any) => {
        if (event === 'storage') storageListeners.push(cb);
      },
      removeEventListener: (event: string, cb: any) => {
        if (event === 'storage') {
          storageListeners = storageListeners.filter((l) => l !== cb);
        }
      },
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    delete (global as any).document;
    delete (global as any).window;
  });

  it('dispara refresh quando aba volta visível e token expira em < 10min', async () => {
    const observer = createTokenRefreshObserver();
    const refresh = jest.fn().mockResolvedValue(true);
    const expAt = Date.now() + 5 * 60 * 1000; // expira em 5 min (critério: < 10min)
    const cb = makeCallback({ expiresAt: expAt, refresh });

    observer.scheduleRefresh(cb);
    expect(refresh).not.toHaveBeenCalled();

    (global as any).document.visibilityState = 'visible';
    visibilityListeners.forEach((l) => l());

    await Promise.resolve();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('NÃO dispara refresh se token ainda tem > 10min', async () => {
    const observer = createTokenRefreshObserver();
    const refresh = jest.fn().mockResolvedValue(true);
    const expAt = Date.now() + 30 * 60 * 1000; // 30 min
    const cb = makeCallback({ expiresAt: expAt, refresh });

    observer.scheduleRefresh(cb);

    (global as any).document.visibilityState = 'visible';
    visibilityListeners.forEach((l) => l());

    await Promise.resolve();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('storage event de outra aba chama onExternalRefresh', () => {
    const observer = createTokenRefreshObserver();
    const onExternalRefresh = jest.fn();
    const expAt = Date.now() + 60 * 60 * 1000;
    const cb = makeCallback({ expiresAt: expAt, onExternalRefresh });

    observer.scheduleRefresh(cb);

    const event = { key: 'ipu_session', newValue: 'novo-token' };
    storageListeners.forEach((l) => l(event));

    expect(onExternalRefresh).toHaveBeenCalledTimes(1);
  });

  it('storage event de chave diferente é ignorado', () => {
    const observer = createTokenRefreshObserver();
    const onExternalRefresh = jest.fn();
    const expAt = Date.now() + 60 * 60 * 1000;
    const cb = makeCallback({ expiresAt: expAt, onExternalRefresh });

    observer.scheduleRefresh(cb);

    const event = { key: 'outra', newValue: 'x' };
    storageListeners.forEach((l) => l(event));

    expect(onExternalRefresh).not.toHaveBeenCalled();
  });
});
