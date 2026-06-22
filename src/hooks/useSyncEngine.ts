import { useEffect, useRef } from 'react';
import { syncModelsUseCase , processPendingDeletesUseCase, processPendingEditsUseCase } from '@/features/models/application/syncModelsUseCase';
import { fetchRemoteModelsUseCase } from '@/features/models/application/fetchRemoteModelsUseCase';
import { schemaMigrationService } from '@/features/models/application/schemaMigrationService';
import { logger } from '@/core/logging/logger';

import { useNetworkStatus } from './useNetworkStatus';
import { useAuth } from './useAuth';
import { getDeviceId } from '@/core/device/deviceId';

const runSync = async () => {
  const deviceId = await getDeviceId();
  logger.info(`[SyncEngine] Iniciando sincronização... [device:${deviceId.slice(0, 8)}]`);
  try {
    await syncModelsUseCase();
    await fetchRemoteModelsUseCase();
    await processPendingDeletesUseCase();
    await processPendingEditsUseCase();
    logger.info(`[SyncEngine] Sincronização concluída [device:${deviceId.slice(0, 8)}]`);
  } catch (error) {
    logger.error('[SyncEngine] Erro durante runSync:', error);
  }
};

type SyncState = 'uninitialized' | 'online' | 'offline';

export const useSyncEngine = () => {
  const isConnected = useNetworkStatus();
  const { isLoading: authLoading, user } = useAuth();
  const syncState = useRef<SyncState>('uninitialized');

  useEffect(() => {
    if (isConnected === true && !authLoading && user) {
      if (syncState.current === 'uninitialized') {
        syncState.current = 'online';
        const init = async () => {
          try {
            const migration = await schemaMigrationService.migrateIfNeeded();
            if (migration.migrated) {
              logger.info(`[Migration] ${migration.count} modelos pendentes marcados para re-sync`);
            }
            await runSync();
          } catch (error) {
            logger.error('[SyncEngine] Erro na inicialização:', error);
          }
        };
        init();
      } else if (syncState.current === 'offline') {
        syncState.current = 'online';
        logger.info('[SyncEngine] Conexão restabelecida, iniciando sincronização...');
        runSync();
      }
    } else if (isConnected === false || isConnected === null) {
      if (syncState.current === 'online') {
        syncState.current = 'offline';
      }
    }
  }, [isConnected, authLoading, user]);
};
