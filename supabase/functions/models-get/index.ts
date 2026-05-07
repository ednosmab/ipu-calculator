// supabase/functions/models-get/index.ts
// GET /models-get — busca modelos do servidor

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { requireAuth, AuthError } from '../_shared/authMiddleware.ts';
import { logAccess } from '../_shared/auditLogger.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') return err('METHOD_NOT_ALLOWED', 405);

  try {
    const { user } = await requireAuth(req, 'viewer');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SECRET_KEYS')!
    );

    const { data: models, error } = await supabase
      .from('models')
      .select('id, name, type, inputs, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[models-get] Erro ao buscar modelos:', error);
      return err('FETCH_FAILED', 500);
    }

    logAccess({
      supabase,
      userId: user.id,
      action: 'model_view',
      resource: 'models',
      req,
    });

    return ok(models || [], 200, req.headers.get('origin'));
  } catch (error) {
    if (error instanceof AuthError) return err(error.code, error.status);
    console.error('[models-get] Erro inesperado:', error);
    return err('INTERNAL_ERROR', 500);
  }
});