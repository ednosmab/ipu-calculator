import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, ReactNode } from 'react';

type PWAInstallContextType = {
  canInstall: boolean;
  isStandalone: boolean;
  install: () => void;
  dismiss: () => void;
  resetDismissStatus: () => void;
  debugInfo?: string;
};

const PWAInstallContext = createContext<PWAInstallContextType | null>(null);

const checkIsStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         (window.navigator as any).standalone === true;
};

export const PWAInstallProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const isInitialized = useRef(false);
  const isDismissed = useRef(localStorage.getItem('pwa_install_dismissed') === 'true');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const standalone = checkIsStandalone();
    setIsStandalone(standalone);
    setDebugInfo(
      `isStandalone: ${standalone}\n` +
      `platform: ${navigator.platform}\n` +
      `agent: ${navigator.userAgent.slice(0, 50)}...`
    );
  }, []);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    const standalone = checkIsStandalone();
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    console.log('[PWA] Init - isStandalone:', standalone, 'isIOS:', isIOS, 'isAndroid:', isAndroid);
    
    if (standalone) return;

    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      console.log('[PWA] display-mode changed:', e.matches);
      setIsStandalone(e.matches);
      if (e.matches) setCanInstall(false);
    };

    const mediaQueryStandalone = window.matchMedia('(display-mode: standalone)');
    mediaQueryStandalone.addEventListener('change', handleDisplayModeChange);
    
    if (isIOS && !standalone) {
      setCanInstall(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      if (isDismissed.current) return;
      console.log('[PWA] beforeinstallprompt fired!');
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQueryStandalone.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const install = useCallback(() => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
       deferredPrompt.userChoice.then((result: any) => {
         console.log(`[PWA] User choice: ${result.outcome}`);
         setDeferredPrompt(null);
         setCanInstall(false);
         isDismissed.current = true;
         localStorage.setItem('pwa_install_dismissed', 'true');
       }).catch((error: any) => {
        console.log('[PWA] Prompt error:', error);
        showManualInstructions();
      });
    } else {
      showManualInstructions();
    }
  }, [deferredPrompt]);

  const showManualInstructions = useCallback(() => {
    const isAndroid = /Android/.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    
    if (isAndroid) {
      window.alert('Para instalar no Android:\n\n1. Toque nos 3 pontos (⋮)\n2. Selecione "Instalar app"');
    } else if (isIOS) {
      window.alert('Para instalar no iPhone:\n\n1. Toque em Compartilhar\n2. Selecione "Adicionar à Tela de Início"');
    } else {
      window.alert('Use o menu do navegador para instalar o App.');
    }
    setCanInstall(false);
    isDismissed.current = true;
    localStorage.setItem('pwa_install_dismissed', 'true');
  }, []);

  const dismiss = useCallback(() => {
    isDismissed.current = true;
    localStorage.setItem('pwa_install_dismissed', 'true');
    setCanInstall(false);
  }, []);

  const resetDismissStatus = useCallback(() => {
    isDismissed.current = false;
    localStorage.removeItem('pwa_install_dismissed');
    setCanInstall(true);
  }, []);

  const value = useMemo(() => ({
    canInstall,
    isStandalone,
    install,
    dismiss,
    resetDismissStatus,
    debugInfo
  }), [canInstall, isStandalone, install, dismiss, resetDismissStatus, debugInfo]);

  return (
    <PWAInstallContext.Provider value={value}>
      {children}
    </PWAInstallContext.Provider>
  );
};

export const usePWAInstall = () => {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error('usePWAInstall must be used within PWAInstallProvider');
  }
  return context;
};
