// supabase/functions/auth-login/index.ts
// POST /auth-login — valida credenciais, registra log, retorna JWT + profile

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { logAccess } from '../_shared/auditLogger.ts';
import { ok, err } from '../_shared/response.ts';

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const kv = await Deno.openKv();

async function checkRateLimit(identifier: string): Promise<boolean> {
  const key = [`rate_limit`, identifier];
  const now = Date.now();

  const entry = await kv.get(key);

  if (!entry.value) {
    await kv.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  const { count, resetAt } = entry.value as { count: number; resetAt: number };

  if (now > resetAt) {
    await kv.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (count >= RATE_LIMIT_MAX) {
    return false;
  }

  await kv.set(key, { count: count + 1, resetAt });
  return true;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return err('METHOD_NOT_ALLOWED', 405);

  try {
    const { email, password } = await req.json();

    if (!email || !password) return err('INVALID_PAYLOAD', 400);

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rateLimitKey = `login:${email.toLowerCase()}`;

    if (!(await checkRateLimit(rateLimitKey))) {
      logAccess({
        supabase: null,
        userId: null,
        action: 'login_rate_limited',
        resource: 'auth',
        metadata: { email: email.toLowerCase(), ip: clientIp },
        req,
      });
      return err('RATE_LIMIT_EXCEEDED', 429);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
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

    supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', data.user.id);

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
