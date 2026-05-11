// Debug which env vars are available
import { handleCors } from '../_shared/cors.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const envVars = {
    SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
    HAS_SERVICE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    HAS_SECRET_KEYS: !!Deno.env.get('SUPABASE_SECRET_KEYS'),
    HAS_ANON_KEY: !!Deno.env.get('SUPABASE_ANON_KEY'),
    SERVICE_KEY_PREFIX: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.substring(0, 10),
  };

  return ok(envVars);
});