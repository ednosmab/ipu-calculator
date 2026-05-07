// supabase/functions/_shared/response.ts
// Helpers de resposta padronizada para todas as Edge Functions

import { corsHeaders } from './cors.ts';

/** Resposta de sucesso com dados JSON */
export function ok(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Resposta de erro com código legível — nunca vaza stack trace */
export function err(code: string, status: number): Response {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
