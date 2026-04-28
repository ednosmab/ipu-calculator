import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncModelsUseCase } from '@/features/models/application/syncModelsUseCase';
import { fetchRemoteModelsUseCase } from '@/features/models/application/fetchRemoteModelsUseCase';
import { schemaMigrationService } from '@/features/models/application/schemaMigrationService';
import { processPendingDeletesUseCase, processPendingEditsUseCase } from '@/features/models/application/syncModelsUseCase';

export const useSyncEngine = () => {
  useEffect(() => {
    const init = async () => {
      const migration = await schemaMigrationService.migrateIfNeeded();
      if (migration.migrated) {
        console.log(`[Migration] ${migration.count} modelos pendentes marcados para re-sync`);
      }

      await syncModelsUseCase();
      await fetchRemoteModelsUseCase();
      await processPendingDeletesUseCase();
      await processPendingEditsUseCase();
    };

    init();

    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('Conexão restabelecida. Disparando sincronização...');
        syncModelsUseCase();
        fetchRemoteModelsUseCase();
        processPendingDeletesUseCase();
        processPendingEditsUseCase();
      }
    });

    return () => unsubscribe();
  }, []);
};