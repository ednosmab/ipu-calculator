// src/hooks/useRequireAuth.ts
// Protege rotas: redireciona se não autenticado ou sem role mínimo
// Nunca renderizar conteúdo protegido antes de isLoading === false

import { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from './useAuth';
import { Role } from '@/core/auth/AuthContext';

const ROLE_HIERARCHY: Role[] = ['viewer', 'editor', 'admin'];

const LOGIN_REDIRECT_KEY = 'ipu_login_redirect';

interface UseRequireAuthOptions {
  /** Permitir acesso sem autenticação se houver cache offline */
  canAccessOffline?: boolean;
  /** Ainda verificando cache local (adiar redirect) */
  isCheckingCache?: boolean;
}

/**
 * Chame no topo de qualquer tela protegida.
 * @param minRole Role mínimo necessário (default: 'viewer')
 * @param options Opções extras (offline, cache)
 * @returns isLoading, isAuthorized
 */
export function useRequireAuth(
  minRole: Role = 'viewer',
  options: UseRequireAuthOptions = {}
) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { canAccessOffline = false, isCheckingCache = false } = options;

  useEffect(() => {
    // Aguarda auth e verificação de cache
    if (isLoading || isCheckingCache) return;

    // Se há cache offline, permite acesso mesmo sem user
    if (!user && canAccessOffline) return;

    if (!user) {
      const currentPath = pathname;
      if (currentPath && currentPath !== '/login') {
        try {
          sessionStorage.setItem(LOGIN_REDIRECT_KEY, currentPath);
        } catch {}
      }
      router.replace('/login');
      return;
    }

    if (!profile?.active) {
      router.replace('/suspended');
      return;
    }

    const userRoleIndex = ROLE_HIERARCHY.indexOf(profile.role);
    const minRoleIndex = ROLE_HIERARCHY.indexOf(minRole);

    if (userRoleIndex < minRoleIndex) {
      router.replace('/unauthorized');
    }
  }, [user, profile, isLoading, minRole, pathname, router, canAccessOffline, isCheckingCache]);

  const isAuthorized = !isLoading && !!user && !!profile?.active;

  return { isLoading, isAuthorized };
}

/**
 * Retorna a rota para redirecionar após login.
 * Prioridade: rota salva > /admin (se admin) > /models
 */
export function getPostLoginRedirect(userRole?: Role): string {
  try {
    const saved = sessionStorage.getItem(LOGIN_REDIRECT_KEY);
    if (saved && saved !== '/login') {
      sessionStorage.removeItem(LOGIN_REDIRECT_KEY);
      return saved;
    }
  } catch {}

  if (userRole === 'admin') {
    return '/admin';
  }
  return '/models';
}
