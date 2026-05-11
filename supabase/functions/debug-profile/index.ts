// supabase/functions/debug-profile/index.ts
// GET /debug-profile?email= — debug profile

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') return err('METHOD_NOT_ALLOWED', 405);

  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');

    if (!email) return err('EMAIL_REQUIRED', 400);

const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { 
        auth: { autoRefreshToken: false, persistSession: false },
        db: { schema: 'public' }
      }
    );

    // Lista usuários
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      return ok({ error: 'user_error', details: userError });
    }

    const user = users.users.find(u => u.email === email);
    if (!user) {
      return ok({ error: 'user_not_found', email });
    }

    // Busca profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return ok({
      user: { id: user.id, email: user.email, created_at: user.created_at },
      profile,
      profileError: profileError ? { code: profileError.code, message: profileError.message } : null,
    });
  } catch (error) {
    return ok({ error: 'unexpected', details: String(error) });
  }
});