// supabase/functions/_shared/cors.ts
// CORS restrito ao domínio configurado — nunca usar '*' em produção

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN');

if (!ALLOWED_ORIGIN) {
  console.error('[CORS] ALLOWED_ORIGIN não configurado — Edge Function pode estar vulnerável');
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN ?? 'null',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
};

/**
 * Trata preflight OPTIONS e retorna null para outros métodos.
 * Toda Edge Function deve chamar isso primeiro.
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  return null;
}
