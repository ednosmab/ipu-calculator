import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncModelsUseCase } from '@/features/models/application/syncModelsUseCase';
import { fetchRemoteModelsUseCase } from '@/features/models/application/fetchRemoteModelsUseCase';
import { schemaMigrationService } from '@/features/models/application/schemaMigrationService';

export const useSyncEngine = () => {
  useEffect(() => {
    const init = async () => {
      // Executa migração antes de qualquer sync
      const migration = await schemaMigrationService.migrateIfNeeded();
      if (migration.migrated) {
        console.log(`[Migration] ${migration.count} modelos pendentes marcados para re-sync`);
      }

      // Tenta sincronizar ao montar o app
      await syncModelsUseCase();
      await fetchRemoteModelsUseCase();
    };

    init();

    // Escuta mudanças na conexão
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('Conexão restabelecida. Disparando sincronização...');
        syncModelsUseCase();
        fetchRemoteModelsUseCase();
      }
    });

    return () => unsubscribe();
  }, []);
};
