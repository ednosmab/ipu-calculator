// supabase/functions/fix-profile/index.ts
// POST /fix-profile — cria profile para usuário existente

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return err('METHOD_NOT_ALLOWED', 405);

  try {
    const { email, name, role } = await req.json();

    if (!email || !name || !role) {
      return err('INVALID_PAYLOAD', 400);
    }

const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { 
        auth: { autoRefreshToken: false, persistSession: false },
        db: { schema: 'public' }
      }
    );

    // Busca usuário pelo email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError || !userData) {
      console.error('[fix-profile] Erro ao listar usuários:', userError);
      return err('USER_NOT_FOUND', 404);
    }

    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      return err('USER_NOT_FOUND', 404);
    }

    // Insere profile (ignora se já existir)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      name,
      role,
      active: true,
    }, { onConflict: 'id' });

    if (profileError) {
      console.error('[fix-profile] Erro ao criar profile:', profileError);
      return err('PROFILE_ERROR', 400);
    }

    return ok({ success: true, userId: user.id });
  } catch (error) {
    console.error('[fix-profile] Erro:', error);
    return err('INTERNAL_ERROR', 500);
  }
});