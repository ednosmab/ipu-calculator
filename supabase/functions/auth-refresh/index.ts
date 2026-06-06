// supabase/functions/auth-refresh/index.ts
// GET /auth-refresh — renova access_token usando refresh_token do Supabase
// Deploy com --verify-jwt (token chega válido, ainda que perto de expirar)
//
// Edge function de refresh: Supabase JS SDK oferece refreshSession() que
// recebe o refresh_token (não o access_token). Para obtê-lo, usamos o
// endpoint POST /auth/v1/token?grant_type=refresh_token.
//
// O refresh_token é persistido no client em sessionStorage e expira em
// ~30 dias por padrão do Supabase. Se também estiver expirado, retorna
// UNAUTHORIZED e o client deve forçar re-login.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { logAccess } from '../_shared/auditLogger.ts';
import { ok, err } from '../_shared/response.ts';

// ── Rate Limiter ──────────────────────────────────────────────
// 10 tentativas/min/user — previne loop de refresh em caso de token corrompido
interface RateLimitEntry {
  count: number;
  windowStart: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function cleanupRateLimitMap(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(key);
    }
  }
}

// ── Handler principal ─────────────────────────────────────────
Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return err('METHOD_NOT_ALLOWED', 405, origin);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Recebe o refresh_token do client (vem no body)
    const { refresh_token } = await req.json();
    if (!refresh_token) return err('MISSING_REFRESH_TOKEN', 400, origin);

    // Valida o refresh_token via fetch direto (Supabase JS SDK não suporta
    // grant_type=refresh_token com service_role key, mas o endpoint REST sim)
    const refreshRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token }),
    });

    if (!refreshRes.ok) {
      const errorText = await refreshRes.text();
      console.warn('[auth-refresh] Refresh falhou:', refreshRes.status, errorText);
      return err('REFRESH_TOKEN_INVALID', 401, origin);
    }

    const refreshData = await refreshRes.json();

    // Valida que veio um session novo
    if (!refreshData.access_token) {
      console.error('[auth-refresh] Resposta sem access_token:', refreshData);
      return err('INVALID_REFRESH_RESPONSE', 500, origin);
    }

    // Rate limit por user_id (extrai do JWT decodificado)
    const userId = JSON.parse(
      atob(refreshData.access_token.split('.')[1])
    ).sub;

    cleanupRateLimitMap();
    if (isRateLimited(userId)) {
      console.warn(`[auth-refresh] Rate limit excedido para user ${userId.slice(0, 8)}...`);
      return err('RATE_LIMITED', 429, origin);
    }

    // Log de sucesso
    const supabase = createClient(supabaseUrl, serviceKey);
    logAccess({
      supabase,
      userId,
      action: 'token_refresh',
      req,
    });

    return ok({
      session: {
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token,
        expires_in: refreshData.expires_in,
        expires_at: refreshData.expires_at,
      },
    }, 200, origin);
  } catch (error) {
    console.error('[auth-refresh] Erro:', error);
    return err('INTERNAL_ERROR', 500, origin);
  }
});
