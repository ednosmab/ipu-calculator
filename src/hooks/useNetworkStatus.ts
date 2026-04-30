import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { logger } from '@/core/logging/logger';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const updateConnection = (connected: boolean) => {
      logger.info('[NetworkStatus] Conexão alterada para:', connected ? 'online' : 'offline');
      setIsConnected(connected);
    };

    // Web: usar eventos nativos do browser
    if (typeof window !== 'undefined') {
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

    // Mobile: usar NetInfo
    NetInfo.fetch().then((state: NetInfoState) => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      updateConnection(connected);
    });

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      updateConnection(connected);
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
};