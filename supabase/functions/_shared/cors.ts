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

// RFC 1918 private IP ranges — para teste em dispositivo físico via Wi-Fi local
const rfc1918Regex = [
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,   // 192.168.0.0/16
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/, // 10.0.0.0/8
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/, // 172.16.0.0/12
];

// Permite todos para desenvolvimento local
const isDev = Deno.env.get('DENO_DEPLOYMENT_ID') === undefined;

export const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

function isLocalhost(origin: string): boolean {
  return origin.includes('localhost') || origin.includes('127.0.0.1');
}

function isRFC1918(origin: string): boolean {
  return rfc1918Regex.some(regex => regex.test(origin));
}

export function handleCors(req: Request): Response | null {
  const origin = req.headers.get('origin') ?? '';

  if (req.method === 'OPTIONS') {
    // Permite localhost e IPs RFC 1918 para desenvolvimento
    if (isLocalhost(origin) || (isDev && isRFC1918(origin))) {
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

  const isLocal = isLocalhost(origin);
  const isPrivate = isDev && isRFC1918(origin);
  const isAllowedVercel = vercelOriginRegex.test(origin);
  
  const allowedOrigin = (isLocal || isPrivate || isAllowedVercel || validOrigins.includes(origin)) 
    ? origin 
    : validOrigins[0];

  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': allowedOrigin,
  };
}
