import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type PWAInstallContextType = {
  canInstall: boolean;
  hasUpdate: boolean;
  install: () => void;
  dismiss: () => void;
  debugInfo?: string;
};

const PWAInstallContext = createContext<PWAInstallContextType | null>(null);

const PWA_INSTALL_KEY = 'pwa_installed';
const PWA_VERSION_KEY = 'pwa_version';

const checkIsStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         (window.navigator as any).standalone === true;
};

const getInstalledVersion = () => localStorage.getItem(PWA_VERSION_KEY);
const getAppVersion = () => process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0';

const checkAlreadyInstalled = (withVersionCheck = true) => {
  const installed = localStorage.getItem(PWA_INSTALL_KEY);
  if (!withVersionCheck) return installed === 'true';
  
  const savedVersion = getInstalledVersion();
  const currentVersion = getAppVersion();
  return installed === 'true' && savedVersion === currentVersion;
};

const hasUpdate = () => {
  const installed = localStorage.getItem(PWA_INSTALL_KEY);
  const savedVersion = getInstalledVersion();
  const currentVersion = getAppVersion();
  return installed === 'true' && savedVersion !== currentVersion;
};

export const PWAInstallProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [hasUpdateAvailable, setHasUpdateAvailableAvailable] = useState(false);

  const debugInfo = `isStandalone: ${checkIsStandalone()}\n` +
    `installed: ${checkAlreadyInstalled()}\n` +
    `update: ${hasUpdate()}\n` +
    `version: ${getAppVersion()}`;

  useEffect(() => {
    // Check both display-mode and localStorage
    const isStandalone = checkIsStandalone();
    const alreadyInstalled = checkAlreadyInstalled();
    const updateAvailable = hasUpdate();
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    console.log('[PWA] Init - isStandalone:', isStandalone, 'alreadyInstalled:', alreadyInstalled, 'update:', updateAvailable, 'version:', getAppVersion(), 'isIOS:', isIOS, 'isAndroid:', isAndroid);
    
// If already installed, show update button (not re-install)
    if (updateAvailable) {
      setHasUpdateAvailable(true);
      console.log('[PWA] Update available, showing update button');
      return;
    }
    
    // If installed and same version, don't show anything
    if (isStandalone || alreadyInstalled) {
      console.log('[PWA] Already same version, hiding button');
      return;
    }

    // Listen for display-mode changes (e.g., after PWA is installed)
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      console.log('[PWA] display-mode changed:', e.matches);
      if (e.matches) {
        setCanInstall(false);
        setHasUpdateAvailable(false);
        localStorage.setItem(PWA_INSTALL_KEY, 'true');
        localStorage.setItem(PWA_VERSION_KEY, getAppVersion());
      }
    };
    const mediaQueryStandalone = window.matchMedia('(display-mode: standalone)');
    mediaQueryStandalone.addEventListener('change', handleDisplayModeChange);
    
    // Also listen for fullscreen mode (common on Android)
    const mediaQueryFullscreen = window.matchMedia('(display-mode: fullscreen)');
    mediaQueryFullscreen.addEventListener('change', handleDisplayModeChange);
    
    // iOS: show install option (never fires beforeinstallprompt)
    if (isIOS) {
      if (!checkIsStandalone() && !checkAlreadyInstalled()) {
        setCanInstall(true);
        console.log('[PWA] iOS detected, showing install button');
      }
    }

    // Android: wait for beforeinstallprompt event, or show after timeout
    if (isAndroid) {
      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        if (!checkIsStandalone() && !checkAlreadyInstalled()) {
          setCanInstall(true);
          console.log('[PWA] beforeinstallprompt fired!');
        }
      };
      
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      
      // Fallback: show button if event doesn't fire within 3 seconds
      const timeout = setTimeout(() => {
        if (!checkIsStandalone() && !checkAlreadyInstalled() && !updateAvailable) {
          setCanInstall(true);
          console.log('[PWA] Android timeout - showing button as fallback');
        } else {
          console.log('[PWA] Android timeout - but already installed');
        }
      }, 3000);
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        mediaQueryStandalone.removeEventListener('change', handleDisplayModeChange);
        mediaQueryFullscreen.removeEventListener('change', handleDisplayModeChange);
        clearTimeout(timeout);
      };
    }

    // Desktop (Chrome): wait for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!checkIsStandalone() && !checkAlreadyInstalled() && !updateAvailable) {
        setCanInstall(true);
        console.log('[PWA] beforeinstallprompt fired!');
      }
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQueryStandalone.removeEventListener('change', handleDisplayModeChange);
      mediaQueryFullscreen.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const install = () => {
    console.log('[PWA] Install clicked, deferredPrompt:', !!deferredPrompt);
    setCanInstall(false);
    localStorage.setItem(PWA_INSTALL_KEY, 'true');
    localStorage.setItem(PWA_VERSION_KEY, getAppVersion());
    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((result: any) => {
        console.log(`[PWA] User chose: ${result.outcome}`);
        setDeferredPrompt(null);
        setCanInstall(false);
      }).catch((error: any) => {
        console.log('[PWA] Error during prompt:', error);
        showManualInstructions();
      });
    } else {
      const isAndroid = /Android/.test(navigator.userAgent);
      if (isAndroid) {
        tryDirectInstall();
      } else {
        showManualInstructions();
      }
    }
  };

  const tryDirectInstall = async () => {
    console.log('[PWA] Trying direct install method for Android');
    try {
      if (window.Promise) {
        const confirmed = window.confirm(
          'Para instalar este app no Android Chrome:\n\n' +
          '1. Toque nos 3 pontos (⋮) no canto superior direito\n' +
          '2. Selecione "Instalar app" ou "Adicionar à tela inicial"\n\n' +
          'Deseja ver instruções detalhadas?'
        );
        if (confirmed) {
          showManualInstructions();
        }
      }
    } catch (e) {
      console.log('[PWA] Direct install failed:', e);
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    console.log('[PWA] No deferredPrompt - showing manual instructions');
    
    const isAndroid = /Android/.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    
    if (isAndroid) {
      window.alert('Para instalar no Android Chrome:\n\n1. Toque nos 3 pontos (⋮) no canto superior\n2. Selecione "Instalar app" ou "Adicionar à tela inicial"');
    } else if (isIOS) {
      window.alert('Para instalar no iOS:\n\n1. Toque no botão Compartilhar (⊞)\n2. Selecione "Tela de Início"');
    } else {
      window.alert('Para instalar:\n\nUse o menu do navegador e selecione "Instalar App"');
    }
  };

  const dismiss = () => {
    setCanInstall(false);
    setHasUpdateAvailable(false);
    localStorage.setItem(PWA_INSTALL_KEY, 'true');
    localStorage.setItem(PWA_VERSION_KEY, getAppVersion());
  };

  return (
    <PWAInstallContext.Provider value={{ canInstall, hasUpdate: hasUpdateAvailable || canInstall, install, dismiss, debugInfo }}>
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