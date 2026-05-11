// supabase/functions/admin-users-delete/index.ts
// DELETE /admin-users-delete — deleta usuário (admin only)

import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { requireAuth, AuthError } from '../_shared/authMiddleware.ts';
import { logAccess } from '../_shared/auditLogger.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Only DELETE method
  if (req.method !== 'DELETE') {
    return err('METHOD_NOT_ALLOWED', 405);
  }

  try {
    const { user: adminUser } = await requireAuth(req, 'admin');

    const { targetId } = await req.json();
    if (!targetId) {
      return err('INVALID_PAYLOAD', 400);
    }

    // Prevent self-deletion
    if (targetId === adminUser.id) {
      return err('CANNOT_DELETE_SELF', 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user info for logging
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', targetId)
      .single();

    // Get email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(targetId);
    const email = authUser?.user?.email ?? 'unknown';

    // Delete profile first (cascade should handle this, but let's be explicit)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', targetId);

    if (profileError) {
      console.error('[admin-users-delete] Erro ao deletar profile:', profileError);
      return err('PROFILE_DELETE_FAILED', 500);
    }

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(targetId);
    if (authError) {
      console.error('[admin-users-delete] Erro ao deletar auth user:', authError);
      return err('USER_DELETE_FAILED', 500);
    }

    logAccess({
      supabase,
      userId: adminUser.id,
      action: 'user_deleted',
      resource: `users:${targetId}`,
      metadata: { name: profile?.name, email },
      req,
    });

    return ok({ success: true }, 200, req.headers.get('origin'));
  } catch (error) {
    if (error instanceof AuthError) return err(error.code, error.status);
    console.error('[admin-users-delete] Erro inesperado:', error);
    return err('INTERNAL_ERROR', 500);
  }
});