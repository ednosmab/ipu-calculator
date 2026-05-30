// auth-login-rate-limit.test.ts
// Rate limiting (5 tentativas/60s)
// Testa a lógica de rate limiting em memória usada pela Edge Function auth-login

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

function createRateLimiter(maxAttempts: number, windowMs: number) {
  const map = new Map<string, RateLimitEntry>();

  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of map.entries()) {
      if (now - entry.windowStart > windowMs) {
        map.delete(key);
      }
    }
  };

  const isRateLimited = (email: string): boolean => {
    const now = Date.now();
    const entry = map.get(email);

    if (!entry || now - entry.windowStart > windowMs) {
      map.set(email, { count: 1, windowStart: now });
      return false;
    }

    entry.count++;
    return entry.count > maxAttempts;
  };

  const getCount = (email: string): number => map.get(email)?.count ?? 0;

  // Avança o relógio interno forçando a janela a expirar
  const advanceWindow = (email: string) => {
    const entry = map.get(email);
    if (entry) {
      entry.windowStart = Date.now() - windowMs - 1;
    }
  };

  return { isRateLimited, getCount, cleanup, advanceWindow };
}

describe('auth-login rate limiting', () => {
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 60_000;
  let limiter: ReturnType<typeof createRateLimiter>;

  beforeEach(() => {
    limiter = createRateLimiter(MAX_ATTEMPTS, WINDOW_MS);
  });

  it('should allow up to 5 attempts then block the 6th', () => {
    const email = 'test@test.com';

    // 5 tentativas permitidas
    for (let i = 0; i < 5; i++) {
      expect(limiter.isRateLimited(email)).toBe(false);
    }

    // 6ª tentativa bloqueada
    expect(limiter.isRateLimited(email)).toBe(true);
  });

  it('should reset rate limit after the window expires', () => {
    const email = 'test@test.com';

    // Esgota as tentativas
    for (let i = 0; i < 5; i++) {
      limiter.isRateLimited(email);
    }
    expect(limiter.isRateLimited(email)).toBe(true);

    // Avança a janela de tempo
    limiter.advanceWindow(email);

    // Deve permitir novamente
    expect(limiter.isRateLimited(email)).toBe(false);
  });

  it('should apply rate limit per email (independent counters)', () => {
    const emailA = 'alice@test.com';
    const emailB = 'bob@test.com';

    // Esgota tentativas do email A
    for (let i = 0; i < 5; i++) {
      limiter.isRateLimited(emailA);
    }
    expect(limiter.isRateLimited(emailA)).toBe(true);

    // Email B ainda pode tentar (contador separado)
    expect(limiter.isRateLimited(emailB)).toBe(false);
  });

  it('should track correct attempt count', () => {
    const email = 'test@test.com';

    expect(limiter.getCount(email)).toBe(0);

    limiter.isRateLimited(email);
    expect(limiter.getCount(email)).toBe(1);

    limiter.isRateLimited(email);
    expect(limiter.getCount(email)).toBe(2);
  });
});
