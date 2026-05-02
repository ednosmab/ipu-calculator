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
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    
    console.log('[PWA] Init - isStandalone:', isStandalone, 'isMobile:', isMobile, 'isIOS:', isIOS);
    
    // iOS: show install option immediately (never fires beforeinstallprompt)
    if (isIOS && !isStandalone) {
      setCanInstall(true);
      console.log('[PWA] iOS detected, canInstall set to true');
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
      console.log('[PWA] beforeinstallprompt fired! - canInstall now true');
    };

    // Listen for Chrome/Android - fires when PWA criteria are met
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
      // No deferredPrompt - show manual instructions
      console.log('[PWA] No deferredPrompt - showing manual instructions');
      
      const isAndroid = /Android/.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      
      if (isAndroid) {
        // Android Chrome: use menu to install
        window.alert('Para instalar no Android Chrome:\n\n1. Toque nos 3 pontos (⋮) no canto superior\n2. Selecione "Instalar app" ou "Adicionar à tela inicial"');
      } else if (isIOS) {
        // iOS Safari: use share sheet
        window.alert('Para instalar no iOS:\n\n1. Toque no botão Compartilhar (⊞)\n2. Selecione "Tela de Início"');
      } else {
        window.alert('Para instalar:\n\nUse o menu do navegador e selecione "Instalar App"');
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