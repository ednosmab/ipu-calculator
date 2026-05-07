// supabase/functions/create-admin/index.ts
// POST /create-admin — cria usuário admin (temporário)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return err('METHOD_NOT_ALLOWED', 405);

  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return err('INVALID_PAYLOAD', 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SECRET_KEYS')!
    );

    // Cria usuário no auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (userError || !userData.user) {
      console.error('[create-admin] Erro ao criar usuário:', userError);
      return err('USER_CREATE_FAILED', 400, userError?.message);
    }

    // Cria perfil com role admin
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userData.user.id,
      name,
      role: 'admin',
      active: true,
    });

    if (profileError) {
      console.error('[create-admin] Erro ao criar profile:', profileError);
      return err('PROFILE_CREATE_FAILED', 400);
    }

    return ok({ 
      success: true, 
      userId: userData.user.id,
      message: 'Usuário admin criado com sucesso' 
    });
  } catch (error) {
    console.error('[create-admin] Erro inesperado:', error);
    return err('INTERNAL_ERROR', 500);
  }
});