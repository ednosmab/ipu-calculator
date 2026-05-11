// Update profile to admin
import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const userId = 'a41d5d1d-58ef-4a38-b0a4-64bf22dad2cb';
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEYS')!;

  const supabase = createClient(supabaseUrl, serviceKey);

  // Try upsert (update or insert)
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      name: 'Admin',
      role: 'admin',
      active: true,
    }, { onConflict: 'id' })
    .select();

  console.log('[update-profile] Result:', data, error);

  return ok({ data, error: error?.message });
});