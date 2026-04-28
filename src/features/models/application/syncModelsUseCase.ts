import { modelRepository } from '../infra/modelRepository';
import { modelSyncService } from '../infra/modelSyncService';
import { pendingOpsService } from '../infra/pendingOpsService';
import { MAX_ATTEMPTS, PendingOperation } from '../domain/pendingOperation';
import { asyncStorageClient, STORAGE_KEYS } from '@/core/storage/asyncStorageClient';

export const processPendingDeletesUseCase = async (): Promise<{ processed: number; failed: number }> => {
  const pendingIds = await pendingOpsService.getPendingDeletes();
  
  if (pendingIds.length === 0) return { processed: 0, failed: 0 };

  console.log(`[PendingDeletes] Processando ${pendingIds.length} deletes pendentes...`);

  let processed = 0;
  let failed = 0;

  for (const id of pendingIds) {
    const success = await modelSyncService.deleteFromRemote(id);
    
    if (success) {
      await pendingOpsService.removePendingDelete(id);
      const models = await modelRepository.getAll();
      const updated = models.filter(m => m.id !== id);
      await asyncStorageClient.set(STORAGE_KEYS.MODELS, updated);
      processed++;
    } else {
      failed++;
    }
  }

  console.log(`[PendingDeletes] Processados: ${processed}, Falhos: ${failed}`);
  return { processed, failed };
};

export const processPendingEditsUseCase = async (): Promise<{ processed: number; failed: number }> => {
  const pendingEdits = await pendingOpsService.getPendingEdits();
  
  if (pendingEdits.length === 0) return { processed: 0, failed: 0 };

  console.log(`[PendingEdits] Processando ${pendingEdits.length} edits pendentes...`);

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
      await modelRepository.update({ ...op.model, syncStatus: 'synced' });
      processed++;
    } else {
      const attempts = op.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        console.log(`[PendingEdits] Modelo ${op.id} excedeu tentativas, removendo da fila`);
        await pendingOpsService.removePendingEdit(op.id);
        failed++;
      } else {
        await pendingOpsService.updatePendingEdit({ ...op, attempts, lastAttempt: Date.now() });
      }
    }
  }

  console.log(`[PendingEdits] Processados: ${processed}, Falhos: ${failed}`);
  return { processed, failed };
};

export const syncModelsUseCase = async (): Promise<void> => {
  const allModels = await modelRepository.getAll();
  const pendingModels = allModels.filter(m => m.syncStatus === 'pending');

  if (pendingModels.length === 0) return;

  console.log(`Iniciando sincronização de ${pendingModels.length} modelos pendentes...`);

  for (const model of pendingModels) {
    const success = await modelSyncService.syncToRemote(model);
    if (success) {
      await modelRepository.update({ ...model, syncStatus: 'synced' });
    }
  }
};