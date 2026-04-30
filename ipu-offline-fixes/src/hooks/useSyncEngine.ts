import { useEffect, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { syncModelsUseCase } from '@/features/models/application/syncModelsUseCase';
import { fetchRemoteModelsUseCase } from '@/features/models/application/fetchRemoteModelsUseCase';
import { schemaMigrationService } from '@/features/models/application/schemaMigrationService';
import { processPendingDeletesUseCase, processPendingEditsUseCase } from '@/features/models/application/syncModelsUseCase';
import { logger } from '@/core/logging/logger';

const runSync = async () => {
  logger.info('[SyncEngine] Iniciando sincronização...');
  await syncModelsUseCase();
  await fetchRemoteModelsUseCase();
  await processPendingDeletesUseCase();
  await processPendingEditsUseCase();
  logger.info('[SyncEngine] Sincronização concluída');
};

export const useSyncEngine = () => {
  const isFirstRun = useRef(true);

  useEffect(() => {
    const init = async () => {
      try {
        const migration = await schemaMigrationService.migrateIfNeeded();
        if (migration.migrated) {
          logger.info(`[Migration] ${migration.count} modelos pendentes marcados para re-sync`);
        }

        await runSync();
      } catch (error) {
        logger.error('[SyncEngine] Erro na inicialização:', error);
      } finally {
        // Bug #3 Fix: isFirstRun deve ser marcado como false após o init(),
        // não dentro do handleOnline. Antes, se a conexão caísse e voltasse
        // rapidamente após a abertura, o handleOnline pulava o sync por achar
        // que ainda era a primeira execução.
        isFirstRun.current = false;
      }
    };

    init();

    const handleOnline = () => {
      if (!isFirstRun.current) {
        logger.info('[SyncEngine] Conexão restabelecida, iniciando sincronização...');
        runSync().catch((error) => logger.error('[SyncEngine] Erro na sincronização:', error));
      }
    };

    // Web: usar eventos nativos do browser
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      return () => window.removeEventListener('online', handleOnline);
    }

    // Mobile: usar NetInfo
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected && state.isInternetReachable) {
        if (!isFirstRun.current) {
          logger.info('[SyncEngine] Conexão restabelecida, iniciando sincronização...');
          runSync().catch((error) => logger.error('[SyncEngine] Erro na sincronização:', error));
        }
        isFirstRun.current = false;
      }
    });

    return () => unsubscribe();
  }, []);
};