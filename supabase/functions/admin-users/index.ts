// supabase/functions/admin-users/index.ts
// GET  /admin-users — lista usuários com perfil
// POST /admin-users — cria novo usuário (admin only)

import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { requireAuth, AuthError } from '../_shared/authMiddleware.ts';
import { logAccess } from '../_shared/auditLogger.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await requireAuth(req, 'admin');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── GET: lista de usuários ──────────────────────────────────
    if (req.method === 'GET') {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, role, active, last_seen, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Busca emails da tabela auth.users via admin API
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.error('[admin-users] Erro ao listar auth users:', authError);
        // Se falhar o auth, retornamos os perfis sem email em vez de quebrar
        return ok(profiles, 200, origin);
      }

      const emailMap = Object.fromEntries(
        (authData?.users || []).map((u) => [u.id, u.email])
      );

      const result = profiles?.map((p) => ({
        ...p,
        email: emailMap[p.id] ?? 'N/A',
      }));

      logAccess({
        supabase,
        userId: user.id,
        action: 'admin_access',
        resource: 'users',
        req,
      });

      return ok(result, 200, origin);
    }

    // ── POST: criar novo usuário
    if (req.method === 'POST') {
      const { name, email, password, role = 'viewer' } = await req.json();

      if (!name || !email || !password) return err('INVALID_PAYLOAD', 400, origin);
      if (!['viewer', 'editor', 'admin'].includes(role)) {
        return err('INVALID_ROLE', 400, origin);
      }

      // Cria usuário em auth.users
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (createError || !newUser.user) {
        console.error('[admin-users] Erro ao criar usuário:', createError);
        return err('USER_CREATION_FAILED', 500, origin);
      }

      // Cria perfil vinculado
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: newUser.user.id, name, role });

      if (profileError) {
        console.error('[admin-users] Erro ao criar profile:', profileError);
        // Rollback: remove o usuário auth criado
        await supabase.auth.admin.deleteUser(newUser.user.id);
        return err('PROFILE_CREATION_FAILED', 500, origin);
      }

      logAccess({
        supabase,
        userId: user.id,
        action: 'user_created',
        resource: `users:${newUser.user.id}`,
        metadata: { name, role },
        req,
      });

      return ok(
        { id: newUser.user.id, name, email, role, active: true },
        201,
        origin
      );
    }

    return err('METHOD_NOT_ALLOWED', 405, origin);
  } catch (error) {
    if (error instanceof AuthError) return err(error.code, error.status, origin);
    console.error('[admin-users] Erro inesperado:', error);
    return err('INTERNAL_ERROR', 500, origin);
  }
});
