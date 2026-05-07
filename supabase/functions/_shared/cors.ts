// supabase/functions/_shared/cors.ts
// CORS restrito aos domínios configurados — nunca usar '*' em produção

const PROD_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://ipu-calculator.vercel.app';
const STAGING_ORIGIN = Deno.env.get('ALLOWED_ORIGIN_STAGING') ?? 'https://ipu-calculator-staging.vercel.app';

const validOrigins = [PROD_ORIGIN, STAGING_ORIGIN];

export const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin') ?? '';
    const allowedOrigin = validOrigins.includes(origin) ? origin : validOrigins[0];
    return new Response(null, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': allowedOrigin,
      },
    });
  }
  return null;
}

export function getCorsHeaders(origin?: string | null) {
  const allowedOrigin = origin && validOrigins.includes(origin) ? origin : validOrigins[0];
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': allowedOrigin,
  };
}
