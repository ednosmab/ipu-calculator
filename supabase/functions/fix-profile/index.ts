// supabase/functions/fix-profile/index.ts
// POST /fix-profile — cria profile para usuário

import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return err('METHOD_NOT_ALLOWED', 405);

  try {
    const { userId } = await req.json();

    if (!userId) {
      return err('INVALID_PAYLOAD', 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // Try different key formats
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEYS')!;

    console.log('[fix-profile] URL:', supabaseUrl);

    // Create client with service role
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user first
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      console.error('[fix-profile] User error:', userError);
      return err('USER_NOT_FOUND', 404);
    }

    const email = userData.user.email;

    // Try insert
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      name: email?.split('@')[0] || 'Admin',
      role: 'admin',
      active: true,
    }, { onConflict: 'id' });

    if (profileError) {
      console.error('[fix-profile] Profile error:', profileError);
      return err('PROFILE_CREATE_FAILED', 500);
    }

    return ok({ success: true, userId, message: 'Profile criado com role admin' });
  } catch (error) {
    console.error('[fix-profile] Erro:', error);
    return err('INTERNAL_ERROR', 500);
  }
});