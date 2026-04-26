import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncModelsUseCase } from '@/features/models/application/syncModelsUseCase';

export const useSyncEngine = () => {
  useEffect(() => {
    // Escuta mudanças na conexão
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('Conexão restabelecida. Disparando sincronização...');
        syncModelsUseCase();
      }
    });

    // Tenta sincronizar ao montar o app também
    syncModelsUseCase();

    return () => unsubscribe();
  }, []);
};
