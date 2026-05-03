import { useEffect, useState, useCallback, useRef } from 'react';

type SWMessage = {
  type: 'SW_UPDATED' | 'SW_ACTIVATED';
};

const getCacheVersion = (url: string) => {
  const match = url.match(/ipu-calc-(.+?)\.js/);
  return match ? match[1] : null;
};

export const useServiceWorkerUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const hasShownRef = useRef(false);
  const lastVersionRef = useRef<string | null>(null);

  const checkForUpdate = useCallback(async () => {
    if (!navigator.serviceWorker || hasShownRef.current) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      const controller = navigator.serviceWorker.controller;
      if (!controller) return;

      const currentVersion = getCacheVersion(controller.scriptURL);
      if (!currentVersion || currentVersion === lastVersionRef.current) return;

      if (registration.waiting) {
        const waitingVersion = getCacheVersion(registration.waiting.scriptURL);
        if (waitingVersion && waitingVersion !== currentVersion) {
          lastVersionRef.current = waitingVersion;
          hasShownRef.current = true;
          setUpdateAvailable(true);
        }
      }
    } catch (e) {
      console.error('SW check error:', e);
    }
  }, []);

  const handleSWMessage = useCallback((event: MessageEvent) => {
    const message = event.data as SWMessage;
    if (message.type === 'SW_UPDATED' || message.type === 'SW_ACTIVATED') {
      if (!hasShownRef.current) {
        hasShownRef.current = true;
        setUpdateAvailable(true);
      }
    }
  }, []);

  const handleControllerChange = useCallback(() => {
    if (!hasShownRef.current) {
      hasShownRef.current = true;
      setUpdateAvailable(true);
    }
  }, []);

  const refreshApp = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch (e) {
      console.error('SW skip waiting error:', e);
    }
    hasShownRef.current = false;
    lastVersionRef.current = null;
    window.location.reload();
  }, []);

  const dismissUpdate = useCallback(() => {
    hasShownRef.current = false;
    lastVersionRef.current = null;
    setUpdateAvailable(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    });

    setTimeout(checkForUpdate, 1000);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [handleSWMessage, handleControllerChange, checkForUpdate]);

  return { updateAvailable, refreshApp, dismissUpdate };
};