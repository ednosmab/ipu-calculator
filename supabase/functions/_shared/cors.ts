// supabase/functions/_shared/cors.ts
// CORS restrito ao domínio do projeto — nunca usar '*' em produção

const PROD_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://ipu-calculator.vercel.app';
const STAGING_ORIGIN = Deno.env.get('ALLOWED_ORIGIN_STAGING') ?? 'https://ipu-calculator-staging.vercel.app';
const VERCEL_PROJECT_PREFIX = Deno.env.get('VERCEL_PROJECT_PREFIX') ?? 'ipu-calculator';

const validOrigins = [PROD_ORIGIN, STAGING_ORIGIN];

// Regex para origens Vercel: permite apenas branches do projeto
// Ex: ipu-calculator.vercel.app, ipu-calculator-staging.vercel.app, ipu-calculator-feat-branch.vercel.app
const vercelOriginRegex = new RegExp(
  `^https:\\/\\/${VERCEL_PROJECT_PREFIX}(-[a-z0-9-]+)?\\.vercel\\.app$`
);

// Permite todos para desenvolvimento local
const isDev = Deno.env.get('DENO_DEPLOYMENT_ID') === undefined;

export const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

export function handleCors(req: Request): Response | null {
  const origin = req.headers.get('origin') ?? '';

  if (req.method === 'OPTIONS') {
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

    // Permite apenas origens Vercel que correspondam ao prefixo do projeto
    if (vercelOriginRegex.test(origin)) {
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
  if (!origin) return { ...corsHeaders, 'Access-Control-Allow-Origin': validOrigins[0] };

  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
  const isAllowedVercel = vercelOriginRegex.test(origin);
  
  const allowedOrigin = (isLocal || isAllowedVercel || validOrigins.includes(origin)) 
    ? origin 
    : validOrigins[0];

  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': allowedOrigin,
  };
}
