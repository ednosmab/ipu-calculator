import { modelRepository } from '../infra/modelRepository';
import { modelSyncService } from '../infra/modelSyncService';

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
