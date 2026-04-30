import { useState, useEffect, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

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
    // Web: use native browser events
    if (typeof window !== 'undefined') {
      const updateConnection = (connected: boolean) => {
        console.log('[NetworkStatus] Conexão alterada para:', connected ? 'online' : 'offline');
        setIsConnected(connected);
      };

      updateConnection(navigator.onLine);

      const handleOnline = () => updateConnection(true);
      const handleOffline = () => updateConnection(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
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