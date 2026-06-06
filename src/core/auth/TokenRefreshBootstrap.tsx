// src/core/auth/TokenRefreshBootstrap.tsx
// Componente invisível que conecta o useTokenRefresh ao AuthProvider.
// Renderiza null — apenas ativa os listeners via useEffect.

import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useTokenRefresh } from './useTokenRefresh';
import { sessionStorage } from './sessionStorage';
import { useToast } from '@/core/toast/ToastProvider';
import { logger } from '@/core/logging/logger';

export function TokenRefreshBootstrap() {
  const router = useRouter();
  const { showToast } = useToast();

  const handleAuthLost = useCallback(
    (reason: 'refresh-failed' | 'no-refresh-token') => {
      logger.warn(`[TokenRefreshBootstrap] Auth lost: ${reason}`);

      // Limpa storage e redireciona
      void sessionStorage.clearAll();

      showToast('Sessão expirada. Faça login novamente.', 'warning');

      setTimeout(() => {
        router.replace('/login');
      }, 1500);
    },
    [router, showToast]
  );

  useTokenRefresh({ onAuthLost: handleAuthLost });

  return null;
}
