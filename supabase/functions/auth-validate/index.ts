// supabase/functions/auth-validate/index.ts
// GET /auth-validate — valida token e retorna profile fresco do banco

import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { requireAuth, AuthError } from '../_shared/authMiddleware.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') return err('METHOD_NOT_ALLOWED', 405, origin);

  try {
    const { user, profile } = await requireAuth(req, 'viewer');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')! ;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! ;
    
    // Busca profile via fetch direto (bypass RLS)
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=id,name,role,active,last_seen`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );
    
    const profiles = await profileRes.json();
    const freshProfile = profiles?.[0];

    if (!freshProfile) {
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
    }, 200, origin);
  } catch (error) {
    if (error instanceof AuthError) return err(error.code, error.status, origin);
    console.error('[auth-validate] Erro inesperado:', error);
    return err('INTERNAL_ERROR', 500, origin);
  }
});