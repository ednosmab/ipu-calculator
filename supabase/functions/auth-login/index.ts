// supabase/functions/auth-login/index.ts
// POST /auth-login — valida credenciais, cria profile se não existir

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { logAccess } from '../_shared/auditLogger.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return err('METHOD_NOT_ALLOWED', 405);

  try {
    const { email, password } = await req.json();

    if (!email || !password) return err('INVALID_PAYLOAD', 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceKey);

    // Autentica usuário
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      return err('INVALID_CREDENTIALS', 401);
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
        return err('PROFILE_CREATE_FAILED', 500);
      }

      profileData = { role: 'admin', active: true, name: userName };
    }

    // Se inactive, bloqueia
    if (profileData.active === false) {
      return err('ACCOUNT_SUSPENDED', 403);
    }

    return ok({
      session: data.session,
      profile: {
        id: data.user.id,
        name: profileData.name,
        role: profileData.role,
        active: profileData.active,
      },
    });
  } catch (error) {
    console.error('[auth-login] Erro:', error);
    return err('INTERNAL_ERROR', 500);
  }
});