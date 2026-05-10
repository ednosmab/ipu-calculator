// src/hooks/useRequireAuth.ts
// Protege rotas: redireciona se não autenticado ou sem role mínimo
// Nunca renderizar conteúdo protegido antes de isLoading === false

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './useAuth';
import { Role } from '@/core/auth/AuthContext';
import { useNetworkStatus } from './useNetworkStatus';
import { modelRepository } from '@/features/models/infra/modelRepository';

const ROLE_HIERARCHY: Role[] = ['viewer', 'editor', 'admin'];

/**
 * Chame no topo de qualquer tela protegida.
 * @param minRole Role mínimo necessário (default: 'viewer')
 * @param allowOfflineAccess Se true, permite acesso offline mesmo sem login (se houver cache local)
 * @returns isAuthorized — use para condicionar a renderização
 */
export function useRequireAuth(minRole: Role = 'viewer', allowOfflineAccess = false) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const isConnected = useNetworkStatus();
  const [hasLocalCache, setHasLocalCache] = useState(false);
  const initialCheckDone = useRef(false);

  // Check for local cache when offline (including initial null state)
  useEffect(() => {
    if (!allowOfflineAccess) return;
    
    // Se ainda não verificou, verificar agora
    if (!initialCheckDone.current || isConnected === false || isConnected === null) {
      modelRepository.getAll().then(models => {
        setHasLocalCache(models.length > 0);
        initialCheckDone.current = true;
      });
    }
  }, [allowOfflineAccess, isConnected]);

  // Considera offline se: explicitly false OU null (ainda carregando, assumir offline temporariamente)
  const isOffline = isConnected === false || isConnected === null;
  const canAccessOffline = allowOfflineAccess && isOffline && hasLocalCache;

  useEffect(() => {
    if (isLoading) return;

    // Se tem acesso offline permitido e não está conectado
    if (canAccessOffline) {
      // Não redireciona - permite acesso aos modelos locais
      return;
    }

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
  }, [user, profile, isLoading, minRole, canAccessOffline]);

  const isAuthorized =
    !isLoading &&
    (!!user || canAccessOffline) &&
    (!user || !!profile?.active) &&
    (!user || ROLE_HIERARCHY.indexOf(profile.role) >= ROLE_HIERARCHY.indexOf(minRole));

  return { isLoading, isAuthorized, isOffline, hasLocalCache };
}
