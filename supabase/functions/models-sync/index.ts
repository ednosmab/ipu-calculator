// supabase/functions/models-sync/index.ts
// POST /models-sync — sincroniza modelo do cliente para o servidor

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { requireAuth, AuthError } from '../_shared/authMiddleware.ts';
import { logAccess } from '../_shared/auditLogger.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') return err('METHOD_NOT_ALLOWED', 405);

  try {
    const { user } = await requireAuth(req, 'editor');

    const { id, name, type, inputs, updated_at } = await req.json();

    if (!id || !name || !type) return err('INVALID_PAYLOAD', 400);
    if (!['ipu', 'calibration'].includes(type)) return err('INVALID_MODEL_TYPE', 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SECRET_KEYS')!
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
      return err('SYNC_FAILED', 500);
    }

    logAccess({
      supabase,
      userId: user.id,
      action: 'model_sync',
      resource: `models:${id}`,
      metadata: { name, type },
      req,
    });

    return ok({ success: true, id }, 200, req.headers.get('origin'));
  } catch (error) {
    if (error instanceof AuthError) return err(error.code, error.status);
    console.error('[models-sync] Erro inesperado:', error);
    return err('INTERNAL_ERROR', 500);
  }
});