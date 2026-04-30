import { modelRepository } from '../infra/modelRepository';
import { modelSyncService } from '../infra/modelSyncService';
import { pendingOpsService } from '../infra/pendingOpsService';
import { MAX_ATTEMPTS } from '../domain/pendingOperation';
import { logger } from '@/core/logging/logger';

export const processPendingDeletesUseCase = async (): Promise<{ processed: number; failed: number }> => {
  const pendingIds = await pendingOpsService.getPendingDeletes();

  if (pendingIds.length === 0) return { processed: 0, failed: 0 };

  logger.info(`[PendingDeletes] Processando ${pendingIds.length} deletes pendentes...`);

  let processed = 0;
  let failed = 0;

  for (const id of pendingIds) {
    const success = await modelSyncService.deleteFromRemote(id);

    if (success) {
      await pendingOpsService.removePendingDelete(id);
      await modelRepository.removeLocal(id);
      processed++;
    } else {
      failed++;
    }
  }

  logger.info(`[PendingDeletes] Processados: ${processed}, Falhos: ${failed}`);
  return { processed, failed };
};

export const processPendingEditsUseCase = async (): Promise<{ processed: number; failed: number }> => {
  const pendingEdits = await pendingOpsService.getPendingEdits();

  if (pendingEdits.length === 0) return { processed: 0, failed: 0 };

  logger.info(`[PendingEdits] Processando ${pendingEdits.length} edits pendentes...`);

  let processed = 0;
  let failed = 0;

  for (const op of pendingEdits) {
    if (!op.model) {
      await pendingOpsService.removePendingEdit(op.id);
      continue;
    }

    const success = await modelSyncService.syncToRemote(op.model);

    if (success) {
      await pendingOpsService.removePendingEdit(op.id);
      // #06 Fix: use updateLocal to avoid triggering a second syncToRemote call
      await modelRepository.updateLocal({ ...op.model, syncStatus: 'synced', localAction: null });
      processed++;
    } else {
      const attempts = op.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        logger.warn(`[PendingEdits] Modelo ${op.id} excedeu tentativas, removendo da fila`);
        await pendingOpsService.removePendingEdit(op.id);
        failed++;
      } else {
        await pendingOpsService.updatePendingEdit({ ...op, attempts, lastAttempt: Date.now() });
      }
    }
  }

  logger.info(`[PendingEdits] Processados: ${processed}, Falhos: ${failed}`);
  return { processed, failed };
};

export const syncModelsUseCase = async (): Promise<void> => {
  const allModels = await modelRepository.getAll();
  const pendingModels = allModels.filter(m => m.syncStatus === 'pending');

  if (pendingModels.length === 0) return;

  logger.info(`[Sync] Iniciando sincronização de ${pendingModels.length} modelos pendentes...`);

  for (const model of pendingModels) {
    const success = await modelSyncService.syncToRemote(model);
    if (success) {
      // #06 Fix: updateLocal avoids double-sync — sync already happened above
      await modelRepository.updateLocal({ ...model, syncStatus: 'synced', localAction: null });
    }
  }
};