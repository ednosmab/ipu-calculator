import { useEffect, useState, useCallback, useRef } from 'react';
import { logger } from '@/core/logging/logger';

export const useServiceWorkerUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isInitializedRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.serviceWorker) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      if (registration.waiting) {
        setUpdateAvailable(true);
        return;
      }

      await registration.update();
    } catch (e) {
      logger.warn('[SW] Check error:', e);
    }
  }, []);

  const handleControllerChange = useCallback(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }
    window.location.reload();
  }, []);

  const applyUpdate = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.serviceWorker) return;

    try {
      setIsUpdating(true);

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        logger.warn('[SW] No registration found, forcing reload');
        window.location.reload();
        return;
      }

      if (registration.waiting) {
        logger.info('[SW] Sending SKIP_WAITING to waiting SW');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return;
      }

      logger.info('[SW] No waiting SW — forcing registration.update()');
      await registration.update();

      const updatedReg = await navigator.serviceWorker.getRegistration();
      if (updatedReg?.waiting) {
        logger.info('[SW] After update() — SW now waiting, sending SKIP_WAITING');
        updatedReg.waiting.postMessage({ type: 'SKIP_WAITING' });
        return;
      }

      logger.info('[SW] No waiting SW after update — forcing page reload');
      window.location.reload();
    } catch (e) {
      logger.error('[SW] Apply update error:', e);
      window.location.reload();
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.serviceWorker) return;

    const handleUpdateFound = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration || !registration.installing) return;

      registration.installing.addEventListener('statechange', (e: any) => {
        if (e.target.state === 'installed' && navigator.serviceWorker.controller) {
          setUpdateAvailable(true);
        }
      });
    };

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        logger.info('[SW] Received SW_UPDATED — reloading');
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    navigator.serviceWorker.addEventListener('message', handleSWMessage);

    checkForUpdate();
    const interval = setInterval(checkForUpdate, 1000 * 60 * 60);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.addEventListener('updatefound', handleUpdateFound);
        if (reg.waiting) {
          setUpdateAvailable(true);
        }
      }
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [handleControllerChange, checkForUpdate]);

  return { updateAvailable, isUpdating, dismissUpdate, applyUpdate };
};