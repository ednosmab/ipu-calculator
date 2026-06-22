// src/core/api/__tests__/edgeFunctionsClient.test.ts
// Testes do parser de erro (gateway vs function) e do método refreshSession.

import { fetchWithAuth, refreshSession } from '../edgeFunctionsClient';
import { sessionStorage } from '@/core/auth/sessionStorage';
import { CONFIG } from '@/core/config';

jest.mock('@/core/auth/sessionStorage', () => ({
  sessionStorage: {
    getToken: jest.fn(),
    setToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setRefreshToken: jest.fn(),
    clearAll: jest.fn(),
  },
}));

const mockGetToken = sessionStorage.getToken as jest.Mock;
const mockGetRefreshToken = sessionStorage.getRefreshToken as jest.Mock;

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
});

function mockFetchResponse(body: unknown, init: { status?: number } = {}) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: (init.status ?? 200) >= 200 && (init.status ?? 200) < 300,
    status: init.status ?? 200,
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response);
}

describe('fetchWithAuth — error parsing', () => {
  it('retorna NO_TOKEN_AVAILABLE quando não há access_token', async () => {
    mockGetToken.mockResolvedValue(null);
    const result = await fetchWithAuth('/models-get');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('NO_TOKEN_AVAILABLE');
    expect(result.errorDetail?.kind).toBe('network');
    expect(result.errorDetail?.code).toBe('NO_TOKEN');
  });

  it('parseia erro do gateway (401 sem Authorization header)', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    mockFetchResponse(
      { code: 'UNAUTHORIZED_NO_AUTH_HEADER', message: 'Missing authorization header' },
      { status: 401 }
    );

    const result = await fetchWithAuth('/models-delete', { method: 'DELETE' });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('UNAUTHORIZED_NO_AUTH_HEADER');
    expect(result.errorDetail?.kind).toBe('gateway');
    expect(result.errorDetail?.code).toBe('UNAUTHORIZED_NO_AUTH_HEADER');
    expect(result.errorDetail?.status).toBe(401);
    expect(result.errorDetail?.message).toContain('Missing authorization');
  });

  it('parseia erro do gateway 403 (ex: FORBIDDEN)', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    mockFetchResponse(
      { code: 'NOT_AUTHORIZED', message: 'JWT not authorized' },
      { status: 403 }
    );

    const result = await fetchWithAuth('/admin-users');

    expect(result.ok).toBe(false);
    expect(result.errorDetail?.kind).toBe('gateway');
    expect(result.errorDetail?.status).toBe(403);
  });

  it('parseia erro da edge function (4xx com campo error)', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    mockFetchResponse({ error: 'INVALID_CREDENTIALS' }, { status: 401 });

    const result = await fetchWithAuth('/auth-login', { method: 'POST' });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('INVALID_CREDENTIALS');
    expect(result.errorDetail?.kind).toBe('function');
    expect(result.errorDetail?.status).toBe(401);
  });

  it('parseia rate limit (429) da edge function', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    mockFetchResponse({ error: 'RATE_LIMITED' }, { status: 429 });

    const result = await fetchWithAuth('/auth-login', { method: 'POST' });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('RATE_LIMITED');
    expect(result.errorDetail?.kind).toBe('function');
    expect(result.errorDetail?.status).toBe(429);
  });

  it('fallback REQUEST_FAILED quando body não é JSON', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    mockFetchResponse('<html>500 Internal Server Error</html>', { status: 500 });

    const result = await fetchWithAuth('/models-get');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('REQUEST_FAILED');
    expect(result.errorDetail?.kind).toBe('function');
    expect(result.errorDetail?.status).toBe(500);
  });

  it('retorna TIMEOUT quando AbortError é lançado', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    const abortError = Object.assign(new Error('Aborted'), { name: 'AbortError' });
    global.fetch = jest.fn().mockRejectedValue(abortError);

    const result = await fetchWithAuth('/models-get');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('TIMEOUT');
    expect(result.errorDetail?.kind).toBe('network');
    expect(result.errorDetail?.code).toBe('TIMEOUT');
  });

  it('retorna NETWORK_ERROR em outros erros de fetch', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    global.fetch = jest.fn().mockRejectedValue(new TypeError('NetworkError'));

    const result = await fetchWithAuth('/models-get');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('NETWORK_ERROR');
    expect(result.errorDetail?.kind).toBe('network');
    expect(result.errorDetail?.code).toBe('NETWORK_ERROR');
  });

  it('re-tenta em TIMEOUT e sucede na 2ª tentativa', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    const abortError = Object.assign(new Error('Aborted'), { name: 'AbortError' });
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ models: [] })),
      });
    global.fetch = fetchMock;

    const result = await fetchWithAuth('/models-get');

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('re-tenta em NETWORK_ERROR e sucede na 2ª tentativa', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ models: [] })),
      });
    global.fetch = fetchMock;

    const result = await fetchWithAuth('/models-get');

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('NÃO re-tenta em erros de gateway (4xx do Supabase)', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () =>
        Promise.resolve(
          JSON.stringify({ code: 'UNAUTHORIZED_NO_AUTH_HEADER', message: 'Missing token' })
        ),
    });

    const result = await fetchWithAuth('/models-get');

    expect(result.ok).toBe(false);
    expect(result.errorDetail?.kind).toBe('gateway');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('NÃO re-tenta em erros de função (4xx/5xx com {error})', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({ error: 'INVALID_CREDENTIALS' })),
    });

    const result = await fetchWithAuth('/auth-login');

    expect(result.ok).toBe(false);
    expect(result.errorDetail?.kind).toBe('function');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('retorna TIMEOUT após 1 retry (2 tentativas totais) em caso de cold start persistente', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    const abortError = Object.assign(new Error('Aborted'), { name: 'AbortError' });
    const fetchMock = jest.fn().mockRejectedValue(abortError);
    global.fetch = fetchMock;

    const result = await fetchWithAuth('/models-delete?id=abc');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('TIMEOUT');
    expect(result.errorDetail?.kind).toBe('network');
    expect(result.errorDetail?.code).toBe('TIMEOUT');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retorna ok=true com data em sucesso 200', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    mockFetchResponse({ models: [{ id: '1' }] });

    const result = await fetchWithAuth('/models-get');

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ models: [{ id: '1' }] });
    expect(result.errorDetail).toBeUndefined();
  });

  it('envia headers corretos: apikey + Authorization + Content-Type', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });
    global.fetch = fetchMock;

    await fetchWithAuth('/models-get');

    const callArgs = fetchMock.mock.calls[0];
    const headers = callArgs[1].headers;
    expect(headers['apikey']).toBe(CONFIG.SUPABASE_ANON_KEY);
    expect(headers['Authorization']).toBe('Bearer valid-token');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('endpoint sem / recebe / automaticamente', async () => {
    mockGetToken.mockResolvedValue('valid-token');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });
    global.fetch = fetchMock;

    await fetchWithAuth('models-get');

    const url = fetchMock.mock.calls[0][0];
    expect(url).toBe(`${CONFIG.EDGE_FUNCTIONS_URL}/models-get`);
  });
});

describe('refreshSession', () => {
  it('retorna NO_REFRESH_TOKEN quando não há refresh_token em storage', async () => {
    mockGetRefreshToken.mockResolvedValue(null);

    const result = await refreshSession();

    expect(result.ok).toBe(false);
    expect(result.error).toBe('NO_REFRESH_TOKEN');
    expect(result.errorDetail?.kind).toBe('network');
    expect(result.errorDetail?.code).toBe('NO_TOKEN');
  });

  it('retorna novo session em sucesso 200', async () => {
    mockGetRefreshToken.mockResolvedValue('valid-refresh-token');
    mockFetchResponse({
      session: {
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        expires_in: 3600,
        expires_at: 1700000000,
      },
    });

    const result = await refreshSession();

    expect(result.ok).toBe(true);
    expect(result.data?.session.access_token).toBe('new-access');
    expect(result.data?.session.refresh_token).toBe('new-refresh');
  });

  it('parseia gateway 401 quando refresh_token inválido', async () => {
    mockGetRefreshToken.mockResolvedValue('expired-refresh');
    mockFetchResponse(
      { code: 'UNAUTHORIZED', message: 'Invalid refresh token' },
      { status: 401 }
    );

    const result = await refreshSession();

    expect(result.ok).toBe(false);
    expect(result.errorDetail?.kind).toBe('gateway');
    expect(result.errorDetail?.code).toBe('UNAUTHORIZED');
  });

  it('parseia erro de função (ex: REFRESH_TOKEN_REUSED)', async () => {
    mockGetRefreshToken.mockResolvedValue('reused-refresh');
    mockFetchResponse({ error: 'REFRESH_TOKEN_REUSED' }, { status: 401 });

    const result = await refreshSession();

    expect(result.ok).toBe(false);
    expect(result.error).toBe('REFRESH_TOKEN_REUSED');
    expect(result.errorDetail?.kind).toBe('function');
  });

  it('envia refresh_token no body, NÃO usa Authorization header', async () => {
    mockGetRefreshToken.mockResolvedValue('test-refresh');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"session":{"access_token":"x","expires_in":1}}'),
    });
    global.fetch = fetchMock;

    await refreshSession();

    const callArgs = fetchMock.mock.calls[0];
    const headers = callArgs[1].headers;
    const body = JSON.parse(callArgs[1].body);

    expect(headers['Authorization']).toBeUndefined();
    expect(headers['apikey']).toBe(CONFIG.SUPABASE_ANON_KEY);
    expect(body).toEqual({ refresh_token: 'test-refresh' });
  });
});
