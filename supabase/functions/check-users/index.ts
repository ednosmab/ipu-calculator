// supabase/functions/check-users/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      return ok({ error: error.message });
    }

    return ok({ users: users.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })) });
  } catch (e) {
    return ok({ error: String(e) });
  }
});