// src/hooks/useRequireAuth.ts
// Protege rotas: redireciona se não autenticado ou sem role mínimo
// Nunca renderizar conteúdo protegido antes de isLoading === false

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from './useAuth';
import { Role } from '@/core/auth/AuthContext';
import { useNetworkStatus } from './useNetworkStatus';
import { modelRepository } from '@/features/models/infra/modelRepository';

const ROLE_HIERARCHY: Role[] = ['viewer', 'editor', 'admin'];

const LOGIN_REDIRECT_KEY = 'ipu_login_redirect';

/**
 * Chame no topo de qualquer tela protegida.
 * @param minRole Role mínimo necessário (default: 'viewer')
 * @param allowOfflineAccess Se true, permite acesso offline mesmo sem login (se houver cache local)
 * @returns isAuthorized — use para condicionar a renderização
 */
export function useRequireAuth(minRole: Role = 'viewer', allowOfflineAccess = false) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isConnected = useNetworkStatus();
  const [hasLocalCache, setHasLocalCache] = useState(false);
  const [isCheckingCache, setIsCheckingCache] = useState(allowOfflineAccess);
  const initialCheckDone = useRef(false);

  // Check for local cache when offline (including initial null state)
  useEffect(() => {
    if (!allowOfflineAccess) {
      setIsCheckingCache(false);
      return;
    }
    
    const check = async () => {
      try {
        const models = await modelRepository.getAll();
        setHasLocalCache(models.length > 0);
      } finally {
        setIsCheckingCache(false);
        initialCheckDone.current = true;
      }
    };

    check();
  }, [allowOfflineAccess]);

  const isOffline = isConnected === false || isConnected === null;
  const canAccessOffline = allowOfflineAccess && isOffline && hasLocalCache;

  useEffect(() => {
    // Só prossegue se o Auth e o Cache Check terminarem
    if (isLoading || isCheckingCache) return;

    if (canAccessOffline) {
      console.log('[useRequireAuth] Acesso offline permitido via cache local');
      return;
    }

    if (!user) {
      console.log('[useRequireAuth] Redirecionando para login (sem user e sem cache offline)');
      // Salva a rota original antes de redirecionar para login
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
  }, [user, profile, isLoading, isCheckingCache, minRole, canAccessOffline, pathname, router]);

  const isAuthorized =
    !isLoading &&
    !isCheckingCache &&
    (!!user || canAccessOffline) &&
    (!user || !!profile?.active) &&
    (!user || ROLE_HIERARCHY.indexOf(profile.role) >= ROLE_HIERARCHY.indexOf(minRole));

  return { isLoading: isLoading || isCheckingCache, isAuthorized, isOffline, hasLocalCache };
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
