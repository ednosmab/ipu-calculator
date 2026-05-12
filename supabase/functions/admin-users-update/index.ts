// supabase/functions/admin-users-update/index.ts
// PATCH /admin-users-update — atualiza role ou active de um usuário (admin only)
// Bloqueia auto-suspensão (T10)

import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { requireAuth, AuthError } from '../_shared/authMiddleware.ts';
import { logAccess } from '../_shared/auditLogger.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'PATCH') return err('METHOD_NOT_ALLOWED', 405, origin);

  try {
    const { user } = await requireAuth(req, 'admin');

    const { targetId, role, active } = await req.json();

    if (!targetId) return err('INVALID_PAYLOAD', 400, origin);

    // T10 — Admin não pode suspender a si mesmo
    if (targetId === user.id && active === false) {
      return err('CANNOT_SUSPEND_SELF', 400, origin);
    }

    // Valida role se fornecido
    if (role !== undefined && !['viewer', 'editor', 'admin'].includes(role)) {
      return err('INVALID_ROLE', 400, origin);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Monta apenas os campos que foram fornecidos
    const updatePayload: Record<string, unknown> = {};
    if (role !== undefined) updatePayload.role = role;
    if (active !== undefined) updatePayload.active = active;

    if (Object.keys(updatePayload).length === 0) {
      return err('INVALID_PAYLOAD', 400, origin);
    }

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', targetId);

    if (error) {
      console.error('[admin-users-update] Erro ao atualizar:', error);
      return err('UPDATE_FAILED', 500, origin);
    }

    // Determina ação de log
    let action = 'role_changed';
    if (active === false) action = 'user_suspended';
    if (active === true) action = 'user_reactivated';

    logAccess({
      supabase,
      userId: user.id,
      action,
      resource: `users:${targetId}`,
      metadata: { role, active },
      req,
    });

    return ok({ success: true }, 200, origin);
  } catch (error) {
    if (error instanceof AuthError) return err(error.code, error.status, origin);
    console.error('[admin-users-update] Erro inesperado:', error);
    return err('INTERNAL_ERROR', 500, origin);
  }
});
