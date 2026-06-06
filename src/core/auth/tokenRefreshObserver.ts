// src/core/auth/tokenRefreshObserver.ts
// Observer proativo de refresh de token JWT.
//
// 4 triggers disparam refresh:
//   1. setTimeout agendado (TTL - 5min) — refresh proativo
//   2. visibilitychange → aba volta a ficar visível: verifica TTL
//   3. storage event → outra aba renovou: atualiza local via callback
//   4. AppState (RN) → app voltou do background: verifica TTL
//
// Cross-tab sync via `storage` event (built-in, sem BroadcastChannel).
// Mobile sync via AppState (visibilitychange não existe no RN).

import { AppState, AppStateStatus } from 'react-native';

const REFRESH_LEAD_TIME_MS = 5 * 60 * 1000; // 5 minutos antes do TTL
const TTL_CRITICAL_MS = 10 * 60 * 1000;    // < 10min: refresh imediato no visibility
const RETRY_DELAY_MS = 30 * 1000;          // 30s entre tentativas falhas
const MAX_REFRESH_ATTEMPTS = 3;

export interface RefreshCallback {
  /** Decodifica o JWT e retorna o timestamp de expiração (segundos) */
  getExpiresAt: () => number | null;
  /** Renova o token (chama Edge Function auth-refresh, atualiza storage) */
  refresh: () => Promise<boolean>;
  /** Chamado quando o token foi renovado por outra aba */
  onExternalRefresh: () => void;
  /** Chamado quando refresh falha N vezes — UI deve forçar re-login */
  onAuthLost: (reason: 'refresh-failed' | 'no-refresh-token') => void;
}

export interface TokenRefreshObserver {
  /** Agenda refresh proativo (TTL - 5min). Reseta attempts. */
  scheduleRefresh(callback: RefreshCallback): void;
  /** Limpa timers e listeners (signOut) */
  clear(): void;
  /** True se observer está ativo */
  readonly isActive: boolean;
}

function decodeJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function createTokenRefreshObserver(): TokenRefreshObserver {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let callback: RefreshCallback | null = null;
  let attempts = 0;
  let isCleared = true;
  let teardown: (() => void) | null = null;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const attemptRefresh = async (): Promise<boolean> => {
    if (!callback) return false;

    try {
      const success = await callback.refresh();
      if (success) {
        attempts = 0;
        // Re-agenda para o próximo ciclo com novo TTL
        scheduleTimer(callback.getExpiresAt());
        return true;
      }
    } catch (err) {
      console.error('[TokenRefreshObserver] Erro no refresh:', err);
    }

    attempts++;
    if (attempts >= MAX_REFRESH_ATTEMPTS) {
      callback.onAuthLost('refresh-failed');
      clear();
      return false;
    }

    // Re-agenda com delay de retry (mantém attempts)
    console.warn(
      `[TokenRefreshObserver] Refresh falhou (tentativa ${attempts}/${MAX_REFRESH_ATTEMPTS}), retry em ${RETRY_DELAY_MS / 1000}s`
    );
    scheduleTimer(Date.now() + RETRY_DELAY_MS);
    return false;
  };

  // ── Handler: aba visível (web) ou app ativo (mobile) ─────────
  const handleVisible = () => {
    if (!callback) return;
    const expiresAt = callback.getExpiresAt();
    if (expiresAt === null) return;

    const timeUntilExpiry = expiresAt - Date.now();
    if (timeUntilExpiry < TTL_CRITICAL_MS) {
      console.info(
        `[TokenRefreshObserver] Token expira em ${Math.round(timeUntilExpiry / 1000)}s — refresh imediato`
      );
      attemptRefresh();
    }
  };

  // ── Handler: storage event (outra aba renovou) ───────────────
  const handleStorage = (e: StorageEvent) => {
    if (e.key !== 'ipu_session' || !e.newValue) return;
    if (!callback) return;

    // Outra aba já renovou — atualiza local e re-agenda
    callback.onExternalRefresh();
    scheduleTimer(callback.getExpiresAt());
  };

  // ── Handler: AppState (RN) ───────────────────────────────────
  const handleAppStateChange = (next: AppStateStatus) => {
    if (next === 'active') handleVisible();
  };

  // ── Setup do observer ────────────────────────────────────────
  const setupListeners = () => {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') handleVisible();
      });
      window.addEventListener('storage', handleStorage);
    }
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('storage', handleStorage);
      }
      sub.remove();
    };
  };

  // ── scheduleTimer unificado ─────────────────────────────────
  // expiresAtOrNow: timestamp absoluto. Se > 0, agenda em TTL - 5min.
  //                   Se === 0, desabilita.
  //                   Se === Date.now() + RETRY_DELAY_MS, agenda retry imediato.
  const scheduleTimer = (expiresAt: number | null) => {
    clearTimer();
    if (!callback) return;

    if (expiresAt === null || expiresAt === 0) {
      console.warn('[TokenRefreshObserver] Sem expiresAt — refresh desabilitado');
      return;
    }

    // Detecta se é um retry (timestamp próximo de "agora + delay")
    const isRetry = Math.abs(expiresAt - Date.now()) < RETRY_DELAY_MS * 2
      && expiresAt < Date.now() + 60 * 1000;

    const fireAt = isRetry
      ? expiresAt
      : Math.max(0, expiresAt - Date.now() - REFRESH_LEAD_TIME_MS);

    if (isRetry) {
      console.info(`[TokenRefreshObserver] Retry em ${Math.round(fireAt / 1000)}s`);
    } else {
      console.info(
        `[TokenRefreshObserver] Refresh agendado em ${Math.round(fireAt / 1000)}s`
      );
    }

    timer = setTimeout(() => {
      attemptRefresh();
    }, fireAt);
  };

  function scheduleRefresh(cb: RefreshCallback): void {
    callback = cb;
    isCleared = false;
    attempts = 0;

    if (teardown) teardown();
    teardown = setupListeners();

    scheduleTimer(cb.getExpiresAt());
  }

  function clear(): void {
    clearTimer();
    if (teardown) {
      teardown();
      teardown = null;
    }
    callback = null;
    attempts = 0;
    isCleared = true;
  }

  return {
    scheduleRefresh,
    clear,
    get isActive() {
      return !isCleared;
    },
  };
}

/** Singleton para uso em todo o app */
export const tokenRefreshObserver = createTokenRefreshObserver();

/** Helper para decodificar JWT exp (uso em testes e AuthProvider) */
export { decodeJwtExp };
