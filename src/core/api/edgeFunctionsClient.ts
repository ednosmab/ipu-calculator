// src/core/api/edgeFunctionsClient.ts
// Cliente centralizado para chamadas às Edge Functions do Supabase
//
// Erros são tipados em 3 kinds para diagnóstico preciso:
//   - gateway: 401/403 do gateway Supabase (antes da função) — code: UNAUTHORIZED_NO_AUTH_HEADER, etc.
//   - function: 4xx/5xx da própria edge function — code: {error: 'INVALID_CREDENTIALS'|'RATE_LIMITED'|...}
//   - network: fetch falhou — code: TIMEOUT | NETWORK_ERROR | NO_TOKEN

import { sessionStorage } from '../auth/sessionStorage';
import { CONFIG } from '@/core/config';

const { SUPABASE_ANON_KEY } = CONFIG;

const TIMEOUT_MS = 8000;
const MAX_RETRIES = 1;
const RETRY_BACKOFF_MS = 750;

export type EdgeFunctionError =
  | {
      kind: 'gateway';
      code: string;
      message: string;
      status: number;
    }
  | {
      kind: 'function';
      code: string;
      status: number;
    }
  | {
      kind: 'network';
      code: 'TIMEOUT' | 'NETWORK_ERROR' | 'NO_TOKEN';
      status: 0;
    };

export interface EdgeFunctionResponse<T = unknown> {
  data?: T;
  error?: string;
  errorDetail?: EdgeFunctionError;
  ok: boolean;
}

async function getAuthToken(): Promise<string | null> {
  return sessionStorage.getToken();
}

export async function fetchWithAuth<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<EdgeFunctionResponse<T>> {
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const result = await fetchWithAuthOnce<T>(endpoint, options);

    const isTransientNetworkError =
      !result.ok &&
      result.errorDetail?.kind === 'network' &&
      (result.errorDetail.code === 'TIMEOUT' ||
        result.errorDetail.code === 'NETWORK_ERROR');

    if (!isTransientNetworkError || attempt > MAX_RETRIES) {
      return result;
    }

    console.warn(
      `[edgeFunctionsClient] 🔄 ${endpoint} tentativa ${attempt}/${MAX_RETRIES} falhou (${result.error}); retry em ${RETRY_BACKOFF_MS}ms...`
    );
    await new Promise(resolve => setTimeout(resolve, RETRY_BACKOFF_MS));
  }

  throw new Error('[edgeFunctionsClient] retry loop exited unexpectedly');
}

async function fetchWithAuthOnce<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<EdgeFunctionResponse<T>> {
  const token = await getAuthToken();

  console.log(`[edgeFunctionsClient] ${endpoint}`, {
    hasToken: !!token,
    method: options.method || 'GET',
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    ...(options.headers as Record<string, string>),
  };

  if (!token) {
    console.warn(`[edgeFunctionsClient] ⚠️ Nenhum token disponível para ${endpoint}`);
    return {
      ok: false,
      error: 'NO_TOKEN_AVAILABLE',
      errorDetail: { kind: 'network', code: 'NO_TOKEN', status: 0 },
    };
  }

  headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${CONFIG.EDGE_FUNCTIONS_URL}${cleanEndpoint}`;
    console.log(`[edgeFunctionsClient] 🚀 Requisição para: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    let data: any = null;
    let parseFailed = false;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      parseFailed = true;
      console.error(`[edgeFunctionsClient] Falha ao parsear JSON de ${endpoint}:`, text);
    }

    if (!response.ok) {
      // Detecta kind do erro:
      // - Gateway Supabase retorna {code, message} (ex: UNAUTHORIZED_NO_AUTH_HEADER)
      // - Edge function retorna {error, status} (ex: {error: 'INVALID_CREDENTIALS'})
      const isGateway = !parseFailed && data?.code && !data?.error;

      if (isGateway) {
        const code = String(data.code);
        const message = String(data.message ?? '');
        console.error(
          `[edgeFunctionsClient] 🛡️ ${endpoint} gateway block: ${code} (${response.status}) — ${message}`
        );
        return {
          ok: false,
          error: code,
          errorDetail: { kind: 'gateway', code, message, status: response.status },
        };
      }

      const errorMessage =
        (data && !parseFailed ? (data.error ?? data.code) : null) ?? 'REQUEST_FAILED';
      const errorCode = String(errorMessage);
      console.error(
        `[edgeFunctionsClient] ❌ ${endpoint} falhou: ${errorCode} (${response.status})`
      );

      return {
        ok: false,
        error: errorCode,
        errorDetail: { kind: 'function', code: errorCode, status: response.status },
      };
    }

    console.log(`[edgeFunctionsClient] ✅ ${endpoint} sucesso`);
    return {
      ok: true,
      data: (data ?? null) as T,
    };
  } catch (e: unknown) {
    clearTimeout(timeoutId);
    const error = e as Error;
    const isTimeout = error.name === 'AbortError';

    const errorType = isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR';
    console.error(`[edgeFunctionsClient] 🔴 ${endpoint} ${errorType}:`, error.message);

    return {
      ok: false,
      error: errorType,
      errorDetail: { kind: 'network', code: errorType, status: 0 },
    };
  }
}

export interface RefreshSessionResponse {
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
  };
}

/**
 * Renova o access_token usando o refresh_token persistido.
 * Retorna o novo session ou { ok: false, errorDetail.kind === 'gateway' }.
 */
export async function refreshSession(): Promise<
  EdgeFunctionResponse<RefreshSessionResponse>
> {
  const refreshToken = await sessionStorage.getRefreshToken();
  if (!refreshToken) {
    return {
      ok: false,
      error: 'NO_REFRESH_TOKEN',
      errorDetail: { kind: 'network', code: 'NO_TOKEN', status: 0 },
    };
  }

  // Bypass de getAuthToken() para usar refresh_token em vez de access_token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${CONFIG.EDGE_FUNCTIONS_URL}/auth-refresh`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    clearTimeout(timeoutId);
    const text = await response.text();
    let data: any = null;
    let parseFailed = false;
    try {
      data = JSON.parse(text);
    } catch {
      parseFailed = true;
    }

    if (!response.ok) {
      const isGateway = !parseFailed && data?.code && !data?.error;
      if (isGateway) {
        return {
          ok: false,
          error: String(data.code),
          errorDetail: {
            kind: 'gateway',
            code: String(data.code),
            message: String(data.message ?? ''),
            status: response.status,
          },
        };
      }
      const errorCode = String(
        (data && !parseFailed ? data.error ?? data.code : null) ?? 'REFRESH_FAILED'
      );
      return {
        ok: false,
        error: errorCode,
        errorDetail: { kind: 'function', code: errorCode, status: response.status },
      };
    }

    return { ok: true, data: data as RefreshSessionResponse };
  } catch (e: unknown) {
    clearTimeout(timeoutId);
    const error = e as Error;
    const isTimeout = error.name === 'AbortError';
    return {
      ok: false,
      error: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      errorDetail: {
        kind: 'network',
        code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
        status: 0,
      },
    };
  }
}

export const edgeFunctionsClient = {
  async syncModel(model: {
    id: string;
    name: string;
    type: string;
    inputs: Record<string, number>;
    version: number;
    updated_at: string;
  }): Promise<boolean> {
    const result = await fetchWithAuth('/models-sync', {
      method: 'POST',
      body: JSON.stringify(model),
    });

    return result.ok;
  },

  async deleteModel(id: string): Promise<boolean> {
    const result = await fetchWithAuth(`/models-delete?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    return result.ok;
  },

  async getModels(): Promise<{
    id: string;
    name: string;
    type: string;
    inputs: Record<string, number>;
    version: number;
    created_at: string;
    updated_at: string;
  }[]> {
    const result = await fetchWithAuth<{
      id: string;
      name: string;
      type: string;
      inputs: Record<string, number>;
      version: number;
      created_at: string;
      updated_at: string;
    }[]>('/models-get', {
      method: 'GET',
    });

    if (!result.ok) {
      throw new Error(result.error ?? 'FAILED_TO_FETCH_MODELS');
    }

    return result.data ?? [];
  },

  async validateSession(): Promise<{ profile?: { id: string; name: string; role: string; active: boolean }; valid: boolean }> {
    const result = await fetchWithAuth<{ profile: { id: string; name: string; role: string; active: boolean } }>(
      '/auth-validate',
      { method: 'GET' }
    );

    if (result.ok && result.data?.profile) {
      return { profile: result.data.profile, valid: true };
    }

    return { valid: false };
  },

  async getAdminUsers(): Promise<any[]> {
    const result = await fetchWithAuth<any[]>('/admin-users', { method: 'GET' });

    if (!result.ok) {
      throw new Error(result.error ?? 'FAILED_TO_FETCH_USERS');
    }

    return result.data ?? [];
  },

  async createAdminUser(data: any): Promise<boolean> {
    const result = await fetchWithAuth('/admin-users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.ok;
  },

  async updateAdminUser(data: { id: string; role?: string; active?: boolean }): Promise<boolean> {
    const { id, ...rest } = data;
    const result = await fetchWithAuth('/admin-users-update', {
      method: 'PATCH',
      body: JSON.stringify({ targetId: id, ...rest }),
    });
    return result.ok;
  },

  async deleteAdminUser(id: string): Promise<boolean> {
    const result = await fetchWithAuth('/admin-users-delete', {
      method: 'DELETE',
      body: JSON.stringify({ targetId: id }),
    });
    return result.ok;
  },

  refreshSession,
  fetchWithAuth,
};
