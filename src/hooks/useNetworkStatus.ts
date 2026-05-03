import { useState, useEffect, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

const verifyActualInternet = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return true;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    await fetch('https://www.google.com/favicon.ico', { 
      mode: 'no-cors', 
      cache: 'no-store',
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (e) {
    return false;
  }
};

const checkConnection = (state: NetInfoState): boolean => {
  if (typeof window !== 'undefined' && navigator.onLine !== undefined) {
    return navigator.onLine;
  }
  return state.isConnected === true && state.isInternetReachable !== false;
};

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Web: use native browser events + real connectivity check
    if (typeof window !== 'undefined') {
      const check = async () => {
        if (!navigator.onLine) {
          setIsConnected(false);
        } else {
          const hasInternet = await verifyActualInternet();
          setIsConnected(hasInternet);
        }
      };

      check();

      window.addEventListener('online', check);
      window.addEventListener('offline', check);

      // Heartbeat: check every 10s if supposedly online
      const interval = setInterval(() => {
        if (navigator.onLine) check();
      }, 10000);

      return () => {
        window.removeEventListener('online', check);
        window.removeEventListener('offline', check);
        clearInterval(interval);
      };
    }

    // Mobile: use NetInfo
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsConnected(checkConnection(state));
    });

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      
      debounceTimer.current = setTimeout(() => {
        setIsConnected(checkConnection(state));
      }, 500);
    });

    return () => {
      unsubscribe();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return isConnected;
};