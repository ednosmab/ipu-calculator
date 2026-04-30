import { Platform } from 'react-native';
import { syncModelsUseCase } from '@/features/models/application/syncModelsUseCase';
import { fetchRemoteModelsUseCase } from '@/features/models/application/fetchRemoteModelsUseCase';
import { processPendingDeletesUseCase, processPendingEditsUseCase } from '@/features/models/application/syncModelsUseCase';
import { logger } from '@/core/logging/logger';

const BACKGROUND_SYNC_TASK = 'background-sync-task';

export const registerBackgroundSync = async () => {
  if (Platform.OS === 'web') {
    logger.info('[BackgroundSync] Ignorando registro em plataforma web');
    return;
  }

  try {
    const TaskManager = require('expo-task-manager');
    const BackgroundFetch = require('expo-background-fetch');

    await TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
      try {
        logger.info('[BackgroundSync] Sincronizando modelos...');

        await syncModelsUseCase();
        await fetchRemoteModelsUseCase();
        await processPendingDeletesUseCase();
        await processPendingEditsUseCase();

        logger.info('[BackgroundSync] Sincronização concluída');

        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        logger.error('[BackgroundSync] Erro:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    const options: BackgroundFetch.BackgroundFetchOptions = {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    };

    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, options);
    logger.info('[BackgroundSync] Tarefa registrada com sucesso');
  } catch (error) {
    logger.error('[BackgroundSync] Erro ao registrar tarefa:', error);
  }
};

export const unregisterBackgroundSync = async () => {
  if (Platform.OS === 'web') return;

  try {
    const BackgroundFetch = require('expo-background-fetch');
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    logger.info('[BackgroundSync] Tarefa desregistrada');
  } catch (error) {
    logger.error('[BackgroundSync] Erro ao desregistrar:', error);
  }
};

export const isBackgroundSyncAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  try {
    const BackgroundFetch = require('expo-background-fetch');
    const status = await BackgroundFetch.getStatusAsync();
    return status === BackgroundFetch.BackgroundFetchStatus.Available;
  } catch {
    return false;
  }
};