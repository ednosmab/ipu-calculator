// supabase/functions/_shared/cors.ts
// CORS restrito aos domínios configurados — nunca usar '*' em produção

const PROD_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://ipu-calculator.vercel.app';
const STAGING_ORIGIN = Deno.env.get('ALLOWED_ORIGIN_STAGING') ?? 'https://ipu-calculator-staging.vercel.app';

const validOrigins = [PROD_ORIGIN, STAGING_ORIGIN];

// Permite todos para desenvolvimento local
const isDev = Deno.env.get('DENO_DEPLOYMENT_ID') === undefined;

export const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin') ?? '';
    // Permite localhost para desenvolvimento
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return new Response(null, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Origin': origin,
        },
      });
    }
    // Produção: permite apenas domínios configurados
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
  const isLocal = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
  const allowedOrigin = isLocal ? origin : (origin && validOrigins.includes(origin) ? origin : validOrigins[0]);
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': allowedOrigin ?? validOrigins[0],
  };
}
