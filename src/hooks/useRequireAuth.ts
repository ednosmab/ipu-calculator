// src/hooks/useRequireAuth.ts
// Protege rotas: redireciona se não autenticado ou sem role mínimo
// Nunca renderizar conteúdo protegido antes de isLoading === false

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './useAuth';
import { Role } from '@/core/auth/AuthContext';

const ROLE_HIERARCHY: Role[] = ['viewer', 'editor', 'admin'];

/**
 * Chame no topo de qualquer tela protegida.
 * @param minRole Role mínimo necessário (default: 'viewer')
 * @returns isAuthorized — use para condicionar a renderização
 */
export function useRequireAuth(minRole: Role = 'viewer') {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Sem sessão → tela de login
    if (!user) {
      router.replace('/login');
      return;
    }

    // Conta suspensa → tela de suspensão
    if (!profile?.active) {
      router.replace('/suspended');
      return;
    }

    // Role insuficiente → tela de acesso negado
    const userRoleIndex = ROLE_HIERARCHY.indexOf(profile.role);
    const minRoleIndex = ROLE_HIERARCHY.indexOf(minRole);

    if (userRoleIndex < minRoleIndex) {
      router.replace('/unauthorized');
    }
  }, [user, profile, isLoading, minRole]);

  const isAuthorized =
    !isLoading &&
    !!user &&
    !!profile?.active &&
    ROLE_HIERARCHY.indexOf(profile.role) >= ROLE_HIERARCHY.indexOf(minRole);

  return { isLoading, isAuthorized };
}
