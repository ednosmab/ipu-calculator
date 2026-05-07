// supabase/functions/models-delete/index.ts
// DELETE /models-delete — remove modelo do servidor

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { requireAuth, AuthError } from '../_shared/authMiddleware.ts';
import { logAccess } from '../_shared/auditLogger.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = requireCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'DELETE') return errResponse('METHOD_NOT_ALLOWED', 405);

  try {
    const { user } = await requireAuth(req, 'editor');

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return errResponse('MISSING_MODEL_ID', 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: deleteError } = await supabase
      .from('models')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[models-delete] Erro ao deletar:', deleteError);
      return errResponse('DELETE_FAILED', 500);
    }

    logAccess({
      supabase,
      userId: user.id,
      action: 'model_delete',
      resource: `models:${id}`,
      req,
    });

    return ok({ success: true, id });
  } catch (error) {
    if (error instanceof AuthError) return errResponse(error.code, error.status);
    console.error('[models-delete] Erro inesperado:', error);
    return errResponse('INTERNAL_ERROR', 500);
  }
});

function requireCors(req: Request): Response | null {
  const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN');
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN ?? 'null',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  };
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }
  return null;
}

function errResponse(code: string, status: number): Response {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'null',
    },
  });
}