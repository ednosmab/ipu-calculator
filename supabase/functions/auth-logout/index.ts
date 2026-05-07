// supabase/functions/auth-logout/index.ts
// POST /auth-logout — invalida sessão no servidor, registra log

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { requireAuth, AuthError } from '../_shared/authMiddleware.ts';
import { logAccess } from '../_shared/auditLogger.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return err('METHOD_NOT_ALLOWED', 405);

  try {
    const { user } = await requireAuth(req);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SECRET_KEYS')!
    );

    // Invalida sessão no Supabase (server-side signout)
    await supabase.auth.admin.signOut(user.id);

    // Logs — logout + session_end (fire-and-forget)
    logAccess({
      supabase,
      userId: user.id,
      action: 'logout',
      resource: 'auth',
      req,
    });

    return ok({ success: true }, 200, req.headers.get('origin'));
  } catch (error) {
    if (error instanceof AuthError) {
      return err(error.code, error.status);
    }
    console.error('[auth-logout] Erro inesperado:', error);
    return err('INTERNAL_ERROR', 500);
  }
});

/*
  curl -X POST https://<project>.supabase.co/functions/v1/auth-logout \
    -H "Authorization: Bearer <access_token>"
*/
