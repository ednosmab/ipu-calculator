// supabase/functions/auth-login/index.ts
// POST /auth-login — valida credenciais, registra log, retorna JWT + profile

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { logAccess } from '../_shared/auditLogger.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  // 1. CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return err('METHOD_NOT_ALLOWED', 405);

  try {
    const { email, password } = await req.json();

    if (!email || !password) return err('INVALID_PAYLOAD', 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 2. Autenticação via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      // Registra login_failed — user_id nulo, email no metadata
      // Resposta sempre INVALID_CREDENTIALS (nunca distingue email/senha — T9)
      logAccess({
        supabase,
        userId: null,
        action: 'login_failed',
        resource: 'auth',
        metadata: { email },
        req,
      });
      return err('INVALID_CREDENTIALS', 401);
    }

    // 3. Verifica se conta está ativa
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active, name')
      .eq('id', data.user.id)
      .single();

    if (!profile?.active) {
      logAccess({
        supabase,
        userId: data.user.id,
        action: 'login_failed',
        resource: 'auth',
        metadata: { reason: 'ACCOUNT_SUSPENDED' },
        req,
      });
      return err('ACCOUNT_SUSPENDED', 403);
    }

    // 4. Atualiza last_seen
    supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', data.user.id);

    // 5. Logs — login + session_start (fire-and-forget)
    logAccess({
      supabase,
      userId: data.user.id,
      action: 'login',
      resource: 'auth',
      req,
    });

    supabase.from('usage_metrics').insert({
      user_id: data.user.id,
      event: 'session_start',
      metadata: { platform: req.headers.get('user-agent') ?? 'unknown' },
    });

    // 6. Retorna session + profile (sem dados sensíveis)
    return ok({
      session: data.session,
      profile: {
        id: data.user.id,
        name: profile.name,
        role: profile.role,
        active: profile.active,
      },
    });
  } catch (error) {
    console.error('[auth-login] Erro inesperado:', error);
    return err('INTERNAL_ERROR', 500);
  }
});

/*
  curl -X POST https://<project>.supabase.co/functions/v1/auth-login \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com","password":"senha123"}'
*/
