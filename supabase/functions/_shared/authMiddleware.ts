// supabase/functions/_shared/authMiddleware.ts
// Middleware de autorização — validado antes de qualquer lógica de negócio

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ROLE_HIERARCHY = ['viewer', 'editor', 'admin'] as const;
type Role = (typeof ROLE_HIERARCHY)[number];

export interface AuthResult {
  user: { id: string; email?: string };
  profile: { role: Role; active: boolean; name: string };
}

/** Erro tipado para distinguir casos no catch das Edge Functions */
export class AuthError extends Error {
  constructor(
    public readonly code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'ACCOUNT_SUSPENDED',
    public readonly status: number
  ) {
    super(code);
    this.name = 'AuthError';
  }
}

/**
 * Valida o JWT do header Authorization, verifica se a conta está ativa
 * e se o role do usuário atende ao mínimo exigido.
 *
 * Lança AuthError com o código adequado — nunca retorna null.
 */
export async function requireAuth(
  req: Request,
  minRole: Role = 'viewer'
): Promise<AuthResult> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) throw new AuthError('UNAUTHORIZED', 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) throw new AuthError('UNAUTHORIZED', 401);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, active, name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) throw new AuthError('UNAUTHORIZED', 401);
  if (!profile.active) throw new AuthError('ACCOUNT_SUSPENDED', 403);

  const userRoleIndex = ROLE_HIERARCHY.indexOf(profile.role as Role);
  const minRoleIndex = ROLE_HIERARCHY.indexOf(minRole);

  if (userRoleIndex < minRoleIndex) throw new AuthError('FORBIDDEN', 403);

  return { user: { id: user.id, email: user.email }, profile };
}
