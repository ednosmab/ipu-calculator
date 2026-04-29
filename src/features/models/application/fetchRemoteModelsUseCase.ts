import { supabase } from '@/core/infra/supabaseClient';
import { asyncStorageClient, STORAGE_KEYS } from '@/core/storage/asyncStorageClient';
import { modelRepository } from '../infra/modelRepository';
import { CalculationModel } from '../domain/calculationModel';

export const fetchRemoteModelsUseCase = async (): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('models')
      .select('*');

    if (error) {
      return;
    }

    const localModels = await modelRepository.getAll();
    
    let updated: CalculationModel[] = [];
    
    if (data && data.length > 0) {
      const remoteModels: CalculationModel[] = data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        inputs: item.inputs,
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime(),
        syncStatus: 'synced' as const,
        localAction: null,
      }));

      for (const rm of remoteModels) {
        const localIndex = updated.findIndex(m => m.id === rm.id);
        if (localIndex >= 0) {
          if (rm.updatedAt > updated[localIndex].updatedAt) {
            updated[localIndex] = rm;
          }
        } else {
          updated.push(rm);
        }
      }
    }

    const remoteIds = data ? new Set(data.map(m => m.id)) : new Set<string>();
    const pendingModels = localModels.filter(m => m.syncStatus === 'pending');
    
    updated = [...updated, ...pendingModels];

    await asyncStorageClient.set(STORAGE_KEYS.MODELS, updated);
  } catch (e) {
    // Offline ou erro de rede - mantém modelos locais
  }
};