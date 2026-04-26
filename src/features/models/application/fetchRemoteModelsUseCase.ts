import { supabase } from '@/core/infra/supabaseClient';
import { modelRepository } from '../infra/modelRepository';
import { CalculationModel } from '../domain/calculationModel';

export const fetchRemoteModelsUseCase = async (): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('models')
      .select('*');

    if (error) {
      console.error('[Pull Sync Error]:', error.message);
      return;
    }

    if (!data || data.length === 0) return;

    // Converte os dados do Supabase para o formato do nosso App
    const remoteModels: CalculationModel[] = data.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      inputs: item.inputs,
      createdAt: new Date(item.created_at).getTime(),
      updatedAt: new Date(item.updated_at).getTime(),
      syncStatus: 'synced',
    }));

    // Busca os modelos locais atuais
    const localModels = await modelRepository.getAll();
    
    // Merge simples: IDs remotos que não estão no local são adicionados
    // Se o ID já existe localmente, ignoramos (para não sobrescrever mudanças offline pendentes)
    const newModels = remoteModels.filter(rm => !localModels.find(lm => lm.id === rm.id));

    if (newModels.length > 0) {
      console.log(`[Pull Sync]: Adicionando ${newModels.length} novos modelos da nuvem.`);
      for (const model of newModels) {
        // Usamos uma versão do repositório que não dispara notificação para cada item
        // mas salve tudo de uma vez seria melhor. Por simplicidade agora:
        await modelRepository.create(model);
      }
    }
  } catch (e) {
    console.error('[Pull Sync Error]:', e);
  }
};
