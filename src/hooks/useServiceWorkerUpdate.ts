import { useEffect, useState, useCallback, useRef } from 'react';

export const useServiceWorkerUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
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

      registration.update();
    } catch (e) {
      console.error('[SW] Check error:', e);
    }
  }, []);

  const handleControllerChange = useCallback(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }
    setUpdateAvailable(true);
  }, []);

  const applyUpdate = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.serviceWorker) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    } catch (e) {
      console.error('[SW] Apply update error:', e);
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

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    
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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [handleControllerChange, checkForUpdate]);

  return { updateAvailable, dismissUpdate, applyUpdate };
};