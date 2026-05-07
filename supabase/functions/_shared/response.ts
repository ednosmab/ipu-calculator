// supabase/functions/_shared/response.ts
// Helpers de resposta padronizada para todas as Edge Functions

import { getCorsHeaders } from './cors.ts';

/** Resposta de sucesso com dados JSON */
export function ok(data: unknown, status = 200, origin?: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

/** Resposta de erro com código legível — nunca vaza stack trace */
export function err(code: string, status: number): Response {
  return new Response(JSON.stringify({ error: code, status }), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
