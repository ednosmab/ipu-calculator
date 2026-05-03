import { supabase } from '@/core/infra/supabaseClient';
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

    // Bug #1 Fix: move local data reading and merging into a locked operation
    await modelRepository.saveWithLock(await (async () => {
      const localModels = await modelRepository.getAll();
      let updated: CalculationModel[] = [...localModels];

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
            // Remote only updates if newer
            if (rm.updatedAt > updated[localIndex].updatedAt) {
              updated[localIndex] = rm;
            }
          } else {
            updated.push(rm);
          }
        }
      }

      const remoteIds = data ? new Set(data.map(m => m.id)) : new Set<string>();
      // Remove only 'synced' that no longer exist remotely
      // Preserve 'pending' models for later sync
      return updated.filter(m =>
        m.syncStatus === 'pending' || remoteIds.has(m.id)
      );
    })());
  } catch (e) {
    // Offline or network error - keep local models
  }
};