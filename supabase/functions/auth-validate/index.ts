// supabase/functions/auth-validate/index.ts
// GET /auth-validate — valida token e retorna profile fresco do banco

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { requireAuth, AuthError } from '../_shared/authMiddleware.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') return err('METHOD_NOT_ALLOWED', 405);

  try {
    const { user, profile } = await requireAuth(req, 'viewer');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Busca dados frescos do profile no banco
    const { data: freshProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, role, active, last_seen')
      .eq('id', user.id)
      .single();

    if (profileError || !freshProfile) {
      throw new AuthError('UNAUTHORIZED', 401);
    }

    // Verifica se conta continua ativa (pode ter sido suspensa desde o login)
    if (!freshProfile.active) {
      throw new AuthError('ACCOUNT_SUSPENDED', 403);
    }

    return ok({
      profile: {
        id: freshProfile.id,
        name: freshProfile.name,
        role: freshProfile.role,
        active: freshProfile.active,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) return err(error.code, error.status);
    console.error('[auth-validate] Erro inesperado:', error);
    return err('INTERNAL_ERROR', 500);
  }
});