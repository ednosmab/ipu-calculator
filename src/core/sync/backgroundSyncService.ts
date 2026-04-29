import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { syncModelsUseCase } from '@/features/models/application/syncModelsUseCase';
import { fetchRemoteModelsUseCase } from '@/features/models/application/fetchRemoteModelsUseCase';
import { processPendingDeletesUseCase, processPendingEditsUseCase } from '@/features/models/application/syncModelsUseCase';
import { captureError, addBreadcrumb } from '@/core/monitoring/sentryService';

const BACKGROUND_SYNC_TASK = 'background-sync-task';

export const registerBackgroundSync = async () => {
  try {
    await TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
      try {
        addBreadcrumb('background_sync', 'Iniciando sincronização em segundo plano');
        console.log('[BackgroundSync] Sincronizando modelos...');

        await syncModelsUseCase();
        await fetchRemoteModelsUseCase();
        await processPendingDeletesUseCase();
        await processPendingEditsUseCase();

        addBreadcrumb('background_sync', 'Sincronização em segundo plano concluída');
        console.log('[BackgroundSync] Sincronização concluída');

        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        captureError(error as Error, { context: 'background_sync' });
        console.error('[BackgroundSync] Erro:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    const options: BackgroundFetch.BackgroundFetchOptions = {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    };

    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, options);
    console.log('[BackgroundSync] Tarefa registrada com sucesso');
  } catch (error) {
    console.error('[BackgroundSync] Erro ao registrar tarefa:', error);
  }
};

export const unregisterBackgroundSync = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    console.log('[BackgroundSync] Tarefa desregistrada');
  } catch (error) {
    console.error('[BackgroundSync] Erro ao desregistrar:', error);
  }
};

export const isBackgroundSyncAvailable = async (): Promise<boolean> => {
  const status = await BackgroundFetch.getStatusAsync();
  return status === BackgroundFetch.BackgroundFetchStatus.Available;
};