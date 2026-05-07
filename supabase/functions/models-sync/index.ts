// supabase/functions/models-sync/index.ts
// POST /models-sync — sincroniza modelo do cliente para o servidor

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { requireAuth, AuthError } from '../_shared/authMiddleware.ts';
import { logAccess } from '../_shared/auditLogger.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = requireCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return errResponse('METHOD_NOT_ALLOWED', 405);

  try {
    const { user, profile } = await requireAuth(req, 'editor');

    const { id, name, type, inputs, updated_at } = await req.json();

    if (!id || !name || !type) {
      return errResponse('INVALID_PAYLOAD', 400);
    }

    if (!['ipu', 'calibration'].includes(type)) {
      return errResponse('INVALID_MODEL_TYPE', 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: upsertError } = await supabase
      .from('models')
      .upsert({
        id,
        name,
        type,
        inputs,
        updated_at: updated_at || new Date().toISOString(),
      });

    if (upsertError) {
      console.error('[models-sync] Erro ao sincronizar:', upsertError);
      return errResponse('SYNC_FAILED', 500);
    }

    logAccess({
      supabase,
      userId: user.id,
      action: 'model_sync',
      resource: `models:${id}`,
      metadata: { name, type },
      req,
    });

    return ok({ success: true, id });
  } catch (error) {
    if (error instanceof AuthError) return errResponse(error.code, error.status);
    console.error('[models-sync] Erro inesperado:', error);
    return errResponse('INTERNAL_ERROR', 500);
  }
});

function requireCors(req: Request): Response | null {
  const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN');
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN ?? 'null',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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