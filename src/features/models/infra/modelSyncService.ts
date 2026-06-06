import { edgeFunctionsClient } from '@/core/api/edgeFunctionsClient';
import { CalculationModel } from '../domain/calculationModel';
import { logger } from '@/core/logging/logger';

export const modelSyncService = {
  async syncToRemote(model: CalculationModel): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      logger.warn('[modelSyncService] Sync abortado: navigator.onLine=false (rede pode estar inicializando)');
      return false;
    }

    const success = await edgeFunctionsClient.syncModel({
      id: model.id,
      name: model.name,
      type: model.type,
      inputs: model.inputs,
      version: model.version,
      updated_at: new Date(model.updatedAt).toISOString(),
    });

    if (success) {
      logger.info('[EdgeFunctions] Modelo sincronizado com sucesso.');
    } else {
      logger.error('[EdgeFunctions] Falha ao sincronizar modelo.');
    }

    return success;
  },

  async deleteFromRemote(id: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      logger.warn('[modelSyncService] Delete abortado: navigator.onLine=false (rede pode estar inicializando)');
      return false;
    }

    const success = await edgeFunctionsClient.deleteModel(id);

    if (!success) {
      logger.error('[EdgeFunctions] Falha ao deletar modelo.');
    }

    return success;
  }
};
