import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type PWAInstallContextType = {
  canInstall: boolean;
  install: () => void;
  dismiss: () => void;
};

const PWAInstallContext = createContext<PWAInstallContextType | null>(null);

export const PWAInstallProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('[PWA] Init - isStandalone:', isStandalone, 'isMobile:', isMobile);
    
    // Mobile: show install option if not standalone (iOS doesn't fire beforeinstallprompt)
    if (isMobile && !isStandalone) {
      setCanInstall(true);
      console.log('[PWA] Mobile detected, canInstall set to true');
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
      console.log('[PWA] beforeinstallprompt fired! - canInstall now true');
    };

    // Always listen - Chrome fires this when PWA criteria are met
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const install = () => {
    console.log('[PWA] Install clicked, deferredPrompt:', !!deferredPrompt);
    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((result: any) => {
        console.log(`[PWA] User chose: ${result.outcome}`);
        setDeferredPrompt(null);
        setCanInstall(false);
      });
    } else {
      // Show browser's native install prompt or instructions
      console.log('[PWA] No deferredPrompt - triggering manual flow');
      
      // Try to open the browser's install UI
      const isAndroid = /Android/.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      
      if (isAndroid) {
        // On Android Chrome, the install option is in the menu
        // Try triggering the browser's UI by re-checking
        window.location.reload();
      } else if (isIOS) {
        // iOS doesn't support PWA install via API
        window.alert('Para instalar: Toque no botão Compartilhar (⊞) e selecione "Tela de Início"');
      } else {
        window.alert('Para instalar: Use o menu do navegador (3 pontos ou linhas) e selecione "Instalar App"');
      }
    }
  };

  const dismiss = () => {
    setCanInstall(false);
  };

  return (
    <PWAInstallContext.Provider value={{ canInstall, install, dismiss }}>
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