// supabase/functions/models-delete/index.ts
// DELETE /models-delete — remove modelo do servidor

import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { requireAuth, AuthError } from '../_shared/authMiddleware.ts';
import { logAccess } from '../_shared/auditLogger.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'DELETE') return err('METHOD_NOT_ALLOWED', 405);

  try {
    const { user } = await requireAuth(req, 'editor');

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) return err('MISSING_MODEL_ID', 400);

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
      return err('DELETE_FAILED', 500);
    }

    logAccess({
      supabase,
      userId: user.id,
      action: 'model_delete',
      resource: `models:${id}`,
      req,
    });

    return ok({ success: true, id }, 200, req.headers.get('origin'));
  } catch (error) {
    if (error instanceof AuthError) return err(error.code, error.status);
    console.error('[models-delete] Erro inesperado:', error);
    return err('INTERNAL_ERROR', 500);
  }
});