// DESATIVADO — endpoint de debug removido de produção
import { handleCors } from '../_shared/cors.ts';
import { err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  return err('NOT_FOUND', 404);
});
