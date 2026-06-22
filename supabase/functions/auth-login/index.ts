// supabase/functions/auth-login/index.ts
// POST /auth-login — valida credenciais, cria profile se não existir
// Rate limiting: 5 tentativas por email a cada 60s (in-memory)

import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { logAccess } from '../_shared/auditLogger.ts';
import { ok, err } from '../_shared/response.ts';

// ── Rate Limiter ──────────────────────────────────────────────
// In-memory Map: funciona em produção pois cada Edge Function
// mantém o isolate vivo. Para multi-região, migrar para Redis.
interface RateLimitEntry {
  count: number;
  windowStart: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // Janela expirada ou nova — reseta
    rateLimitMap.set(email, { count: 1, windowStart: now });
    return false;
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
}

// Limpeza lazy de entradas expiradas (executa a cada chamada)
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
    const { email, password } = await req.json();

    if (!email || !password) return err('INVALID_PAYLOAD', 400, origin);

    // Rate limiting: verifica antes de qualquer operação
    cleanupRateLimitMap();
    if (isRateLimited(email)) {
      console.warn(`[auth-login] Rate limit excedido para: ${email.replace(/(?<=.).(?=[^@]*@)/g, '*')}`);
      return err('RATE_LIMITED', 429, origin);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceKey);

    // Autentica usuário
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      logAccess({
        supabase,
        userId: null,
        action: 'login_failed',
        metadata: { email },
        req,
      });
      return err('INVALID_CREDENTIALS', 401, origin);
    }

    // Busca profile via fetch direto (bypass RLS)
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${data.user.id}&select=role,active,name`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );
    
    let profileData = null;
    const profileJson = await profileRes.json();
    profileData = profileJson?.[0];

    // Se não existir, cria
    if (!profileData) {
      const userName = email.split('@')[0] || 'Usuário';
      
      const createRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles`,
        {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            id: data.user.id,
            name: userName,
            role: 'admin',
            active: true,
          }),
        }
      );
      
      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error('[auth-login] Create error:', errText);
        return err('PROFILE_CREATE_FAILED', 500, origin);
      }

      profileData = { role: 'admin', active: true, name: userName };
    }

    // Se inactive, bloqueia
    if (profileData.active === false) {
      return err('ACCOUNT_SUSPENDED', 403, origin);
    }

    // Log de sucesso
    logAccess({
      supabase,
      userId: data.user.id,
      action: 'login',
      req,
    });

    return ok({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
      },
      profile: {
        id: data.user.id,
        name: profileData.name,
        role: profileData.role,
        active: profileData.active,
      },
    }, 200, origin);
  } catch (error) {
    console.error('[auth-login] Erro:', error);
    return err('INTERNAL_ERROR', 500, origin);
  }
});
