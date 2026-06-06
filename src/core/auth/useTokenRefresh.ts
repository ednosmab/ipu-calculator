// src/core/auth/useTokenRefresh.ts
// Hook que conecta o AuthProvider ao TokenRefreshObserver.
//
// Comportamento:
//   - Após signIn ou restore: agenda refresh proativo (TTL - 5min)
//   - Em signOut: limpa observer
//   - Quando recebe erro 401 do gateway: tenta refresh 1x, se falhar dispara onAuthLost
//   - Quando token expira < 10min e aba volta a ficar visível: refresh imediato

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { sessionStorage } from './sessionStorage';
import { decodeJwtExp, tokenRefreshObserver } from './tokenRefreshObserver';
import { refreshSession } from '@/core/api/edgeFunctionsClient';
import { logger } from '@/core/logging/logger';

interface UseTokenRefreshOptions {
  /** Callback disparado quando auth é perdida (refresh falhou 3x ou sem refresh_token) */
  onAuthLost?: (reason: 'refresh-failed' | 'no-refresh-token') => void;
}

export function useTokenRefresh(options: UseTokenRefreshOptions = {}): void {
  const { onAuthLost } = options;
  const { session, signOut } = useAuth();
  const onAuthLostRef = useRef(onAuthLost);
  const signOutRef = useRef(signOut);
  const sessionRef = useRef(session);

  useEffect(() => {
    onAuthLostRef.current = onAuthLost;
    signOutRef.current = signOut;
    sessionRef.current = session;
  });

  const performRefresh = useCallback(async (): Promise<boolean> => {
    logger.info('[useTokenRefresh] Renovando token...');
    const result = await refreshSession();

    if (!result.ok || !result.data) {
      const reason =
        result.errorDetail?.kind === 'network' && result.errorDetail.code === 'NO_TOKEN'
          ? 'no-refresh-token'
          : 'refresh-failed';
      logger.warn(`[useTokenRefresh] Refresh falhou: ${result.error} (${reason})`);
      onAuthLostRef.current?.(reason);
      return false;
    }

    const { session: newSession } = result.data;

    // Persiste novo access_token + refresh_token
    await sessionStorage.setToken(newSession.access_token);
    if (newSession.refresh_token) {
      await sessionStorage.setRefreshToken(newSession.refresh_token);
    }

    logger.info(
      `[useTokenRefresh] Token renovado, expira em ${newSession.expires_in}s`
    );
    return true;
  }, []);

  // Agenda refresh quando session muda (login ou restore)
  useEffect(() => {
    if (!session?.access_token) {
      tokenRefreshObserver.clear();
      return;
    }

    const expiresAt = decodeJwtExp(session.access_token);
    if (!expiresAt) {
      logger.warn('[useTokenRefresh] Não foi possível decodificar expiresAt do JWT');
      return;
    }

    tokenRefreshObserver.scheduleRefresh({
      getExpiresAt: () => decodeJwtExp(session.access_token ?? ''),
      refresh: performRefresh,
      onExternalRefresh: () => {
        // Outra aba renovou — recarrega token local
        // (AuthProvider ainda tem o antigo em state; isso é melhor tratado
        //  via storage event direto no edgeFunctionsClient)
      },
      onAuthLost: (reason) => {
        logger.warn(`[useTokenRefresh] Auth lost: ${reason}`);
        onAuthLostRef.current?.(reason);
      },
    });

    return () => {
      tokenRefreshObserver.clear();
    };
  }, [session?.access_token, performRefresh]);
}
