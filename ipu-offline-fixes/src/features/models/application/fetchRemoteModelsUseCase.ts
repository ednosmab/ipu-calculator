import { supabase } from '@/core/infra/supabaseClient';
import { asyncStorageClient, STORAGE_KEYS } from '@/core/storage/asyncStorageClient';
import { modelRepository } from '../infra/modelRepository';
import { CalculationModel } from '../domain/calculationModel';

const MODEL_TTL_MS = 48 * 60 * 60 * 1000;

export const fetchRemoteModelsUseCase = async (): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('models')
      .select('*');

    if (error) {
      return;
    }

    const localModels = await modelRepository.getAll();

    // Bug #1 Fix: o merge agora começa com os modelos locais como base,
    // evitando que modelos 'synced' existentes sejam silenciosamente apagados
    // quando o remote demora ou retorna uma lista parcial.
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
          // Remote ganha apenas se for mais recente
          if (rm.updatedAt > updated[localIndex].updatedAt) {
            updated[localIndex] = rm;
          }
        } else {
          updated.push(rm);
        }
      }
    }

    const remoteIds = data ? new Set(data.map(m => m.id)) : new Set<string>();

    // Remove apenas modelos 'synced' que não existem mais no remote;
    // modelos 'pending' são preservados para sincronização futura.
    updated = updated.filter(m =>
      m.syncStatus === 'pending' || remoteIds.has(m.id)
    );

    await asyncStorageClient.set(STORAGE_KEYS.MODELS, {
      data: updated,
      expiresAt: Date.now() + MODEL_TTL_MS,
    });
  } catch (e) {
    // Offline ou erro de rede — mantém modelos locais
  }
};
