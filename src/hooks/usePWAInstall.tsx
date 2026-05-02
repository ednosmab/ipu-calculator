import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

type PWAInstallContextType = {
  canInstall: boolean;
  install: () => void;
  dismiss: () => void;
  debugInfo: string;
};

const PWAInstallContext = createContext<PWAInstallContextType | null>(null);

export const PWAInstallProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const debugRef = useRef<string[]>([]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const log = `[${timestamp}] ${msg}`;
    debugRef.current.push(log);
    if (debugRef.current.length > 10) debugRef.current.shift();
    setDebugLogs([...debugRef.current]);
  };

  const debugInfo = `isStandalone: ${window.matchMedia('(display-mode: standalone)').matches}\n` +
    `URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}\n` +
    `HTTPS: ${typeof window !== 'undefined' ? window.location.protocol === 'https:' : 'N/A'}\n` +
    `deferredPrompt: ${!!deferredPrompt}\n` +
    `canInstall: ${canInstall}\n` +
    debugLogs.join('\n');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    console.log('[PWA] Init - isStandalone:', isStandalone, 'isMobile:', isMobile, 'isIOS:', isIOS, 'isAndroid:', isAndroid);
    
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
      addLog('beforeinstallprompt fired!');
    };

    // Listen for Chrome/Android - fires when PWA criteria are met
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Debug: Log when the event is NOT fired after a delay
    setTimeout(() => {
      if (!deferredPrompt && isAndroid) {
        addLog('Timeout: beforeinstallprompt NOT fired');
        addLog(`URL: ${window.location.href}`);
        
        // Show debug info on screen
        setShowDebug(true);
      }
    }, 5000);

    // Check if app is already installed
    if (isStandalone) {
      console.log('[PWA] App is already in standalone mode');
      setCanInstall(false);
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    // iOS: show install option immediately (never fires beforeinstallprompt)
    if (isIOS) {
      setCanInstall(true);
      console.log('[PWA] iOS detected, canInstall set to true');
    }

    // Android: wait for beforeinstallprompt event
    // Don't set canInstall immediately - wait for the event
    if (isAndroid) {
      console.log('[PWA] Android detected, waiting for beforeinstallprompt event');
      
      // Fallback: if event doesn't fire within 3 seconds, show button anyway
      const timeout = setTimeout(() => {
        console.log('[PWA] Android timeout - showing install button as fallback');
        setCanInstall(true);
      }, 3000);
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        clearTimeout(timeout);
      };
    }

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
      }).catch((error: any) => {
        console.log('[PWA] Error during prompt:', error);
        // Fallback to manual instructions
        showManualInstructions();
      });
    } else {
      // Try direct install method for Android when deferredPrompt is not available
      const isAndroid = /Android/.test(navigator.userAgent);
      if (isAndroid) {
        // Try to trigger install prompt directly
        tryDirectInstall();
      } else {
        // No deferredPrompt - show manual instructions
        showManualInstructions();
      }
    }
  };

  const tryDirectInstall = async () => {
    console.log('[PWA] Trying direct install method for Android');
    
    // Check if the browser supports the BeforeInstallPromptEvent
    // Some Android browsers support this method to trigger the install prompt
    try {
      if (window.Promise) {
        // Show a more helpful message for Android
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
      // Android Chrome: use menu to install
      window.alert('Para instalar no Android Chrome:\n\n1. Toque nos 3 pontos (⋮) no canto superior\n2. Selecione "Instalar app" ou "Adicionar à tela inicial"');
    } else if (isIOS) {
      // iOS Safari: use share sheet
      window.alert('Para instalar no iOS:\n\n1. Toque no botão Compartilhar (⊞)\n2. Selecione "Tela de Início"');
    } else {
      window.alert('Para instalar:\n\nUse o menu do navegador e selecione "Instalar App"');
    }
  };

  const dismiss = () => {
    setCanInstall(false);
  };

  return (
    <PWAInstallContext.Provider value={{ canInstall, install, dismiss, debugInfo }}>
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