// ===== CORREÇÃO RÁPIDA #1: edgeFunctionsClient.ts =====
// Adicionar debug logging e validação de token

// src/core/api/edgeFunctionsClient.ts
// Cliente centralizado para chamadas às Edge Functions do Supabase

import { sessionStorage } from '../auth/sessionStorage';

const API_BASE = process.env.EXPO_PUBLIC_EDGE_FUNCTIONS_URL ?? '';

const TIMEOUT_MS = 3500;

interface EdgeFunctionResponse<T = unknown> {
  data?: T;
  error?: string;
  ok: boolean;
}

async function getAuthToken(): Promise<string | null> {
  return sessionStorage.getToken();
}

async function fetchWithAuth<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<EdgeFunctionResponse<T>> {
  const token = await getAuthToken();

  // ✅ DEBUG: Log se há token
  console.log(`[edgeFunctionsClient] ${endpoint}`, {
    hasToken: !!token,
    tokenLength: token?.length ?? 0,
    tokenPrefix: token ? token.substring(0, 20) + '...' : 'NONE',
    method: options.method || 'GET',
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // ✅ NOVO: Validar que token existe
  if (!token) {
    console.warn(`[edgeFunctionsClient] ⚠️ Nenhum token disponível para ${endpoint}`);
    return {
      ok: false,
      error: 'NO_TOKEN_AVAILABLE',
    };
  }

  headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${API_BASE}${endpoint}`;
    console.log(`[edgeFunctionsClient] 🚀 Requisição para: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    // ✅ NOVO: Log detalhado de resposta
    console.log(`[edgeFunctionsClient] ${endpoint} ${response.status}`, {
      ok: response.ok,
      status: response.status,
      error: data.error,
    });

    if (!response.ok) {
      const errorMessage = data.error ?? 'REQUEST_FAILED';
      console.error(`[edgeFunctionsClient] ❌ ${endpoint} falhou: ${errorMessage} (${response.status})`);

      return {
        ok: false,
        error: errorMessage,
      };
    }

    console.log(`[edgeFunctionsClient] ✅ ${endpoint} sucesso`);
    return {
      ok: true,
      data: data as T,
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
    };
  }
}

export const edgeFunctionsClient = {
  // Models
  async syncModel(model: {
    id: string;
    name: string;
    type: string;
    inputs: Record<string, number>;
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
    created_at: string;
    updated_at: string;
  }[]> {
    const result = await fetchWithAuth<{
      id: string;
      name: string;
      type: string;
      inputs: Record<string, number>;
      created_at: string;
      updated_at: string;
    }[]>('/models-get', {
      method: 'GET',
    });

    if (result.ok && result.data) {
      return result.data;
    }

    // ✅ NOVO: Log se retornar vazio
    if (!result.ok) {
      console.warn(`[edgeFunctionsClient] getModels falhou: ${result.error}`);
    }

    return [];
  },

  // Auth
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
};
