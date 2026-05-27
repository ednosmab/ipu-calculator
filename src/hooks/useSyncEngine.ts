import { useEffect, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { syncModelsUseCase , processPendingDeletesUseCase, processPendingEditsUseCase } from '@/features/models/application/syncModelsUseCase';
import { fetchRemoteModelsUseCase } from '@/features/models/application/fetchRemoteModelsUseCase';
import { schemaMigrationService } from '@/features/models/application/schemaMigrationService';
import { logger } from '@/core/logging/logger';

import { useNetworkStatus } from './useNetworkStatus';
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

export const useSyncEngine = () => {
  const isConnected = useNetworkStatus();
  const prevConnected = useRef<boolean | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;
      
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

    if (isConnected === true) {
      init();
    }
  }, [isConnected]);

  useEffect(() => {
    if (prevConnected.current === false && isConnected === true) {
      logger.info('[SyncEngine] Conexão restabelecida, iniciando sincronização...');
      runSync();
    }
    prevConnected.current = isConnected;
  }, [isConnected]);
};