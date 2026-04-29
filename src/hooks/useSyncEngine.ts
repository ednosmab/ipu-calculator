import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncModelsUseCase } from '@/features/models/application/syncModelsUseCase';
import { fetchRemoteModelsUseCase } from '@/features/models/application/fetchRemoteModelsUseCase';
import { schemaMigrationService } from '@/features/models/application/schemaMigrationService';
import { processPendingDeletesUseCase, processPendingEditsUseCase } from '@/features/models/application/syncModelsUseCase';
import { captureError, addBreadcrumb } from '@/core/monitoring/sentryService';

export const useSyncEngine = () => {
  useEffect(() => {
    const init = async () => {
      try {
        const migration = await schemaMigrationService.migrateIfNeeded();
        if (migration.migrated) {
          console.log(`[Migration] ${migration.count} modelos pendentes marcados para re-sync`);
        }

        await syncModelsUseCase();
        await fetchRemoteModelsUseCase();
        await processPendingDeletesUseCase();
        await processPendingEditsUseCase();
      } catch (error) {
        captureError(error as Error, { context: 'sync_engine_init' });
      }
    };

    init();

    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        addBreadcrumb('sync', 'Conexão restabelecida, iniciando sincronização');
        console.log('Conexão restabelecida. Disparando sincronização...');
        syncModelsUseCase()
          .catch((error) => captureError(error, { context: 'sync_on_reconnect' }));
        fetchRemoteModelsUseCase()
          .catch((error) => captureError(error, { context: 'fetch_on_reconnect' }));
        processPendingDeletesUseCase()
          .catch((error) => captureError(error, { context: 'pending_deletes_on_reconnect' }));
        processPendingEditsUseCase()
          .catch((error) => captureError(error, { context: 'pending_edits_on_reconnect' }));
      }
    });

    return () => unsubscribe();
  }, []);
};