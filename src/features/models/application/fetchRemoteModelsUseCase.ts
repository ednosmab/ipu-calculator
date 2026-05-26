import { edgeFunctionsClient } from '@/core/api/edgeFunctionsClient';
import { modelRepository } from '../infra/modelRepository';
import { CalculationModel } from '../domain/calculationModel';

export const fetchRemoteModelsUseCase = async (): Promise<void> => {
  console.log('[fetchRemoteModelsUseCase] Iniciando busca de modelos remotos...');

  try {
    console.log('[fetchRemoteModelsUseCase] Chamando edgeFunctionsClient.getModels()');
    const data = await edgeFunctionsClient.getModels();

    console.log('[fetchRemoteModelsUseCase] Resposta recebida:', {
      modelCount: data?.length ?? 0,
      models: data?.map(m => ({ id: m.id, name: m.name, version: m.version })),
    });

    await modelRepository.saveWithLock(
      await (async () => {
        const localModels = await modelRepository.getAll();

        console.log('[fetchRemoteModelsUseCase] Modelos locais:', {
          count: localModels.length,
          models: localModels.map(m => ({
            id: m.id,
            name: m.name,
            syncStatus: m.syncStatus,
          })),
        });

        let updated: CalculationModel[] = [...localModels];

        if (!data) {
          console.log('[fetchRemoteModelsUseCase] Nenhum dado remoto recebido; mantendo cache local intacto.');
          return localModels;
        }

        const remoteModels: CalculationModel[] = data.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          inputs: item.inputs,
          createdAt: new Date(item.created_at).getTime(),
          updatedAt: new Date(item.updated_at).getTime(),
          version: item.version,
          syncStatus: 'synced' as const,
          localAction: null,
        }));

        console.log('[fetchRemoteModelsUseCase] Processando merge...', {
          remoteCount: remoteModels.length,
        });

        let mergedCount = 0;
        let addedCount = 0;

        for (const rm of remoteModels) {
          const localIndex = updated.findIndex((m) => m.id === rm.id);

          if (localIndex >= 0) {
            const local = updated[localIndex];
            const remoteNewer = rm.version > local.version || (rm.version === local.version && rm.updatedAt > local.updatedAt);
            if (remoteNewer) {
              console.log(`[fetchRemoteModelsUseCase] Atualizando modelo: ${rm.name} (v${local.version} → v${rm.version})`);
              updated[localIndex] = rm;
              mergedCount++;
            }
          } else {
            console.log(`[fetchRemoteModelsUseCase] Adicionando novo modelo: ${rm.name}`);
            updated.push(rm);
            addedCount++;
          }
        }

        console.log('[fetchRemoteModelsUseCase] Merge concluído:', {
          updated: mergedCount,
          added: addedCount,
          total: updated.length,
        });

        const remoteIds = new Set(data.map((m) => m.id));
        const filtered = updated.filter(
          (m) => m.syncStatus === 'pending' || remoteIds.has(m.id)
        );

        console.log('[fetchRemoteModelsUseCase] Filtragem final:', {
          before: updated.length,
          after: filtered.length,
          removed: updated.length - filtered.length,
        });

        return filtered;
      })()
    );

    console.log('[fetchRemoteModelsUseCase] ✅ Sincronização concluída com sucesso');
  } catch (e: unknown) {
    const error = e as Error;

    console.error('[fetchRemoteModelsUseCase] ❌ Erro durante sincronização:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    if (error.message.includes('UNAUTHORIZED') || error.message.includes('NO_TOKEN')) {
      console.error('[fetchRemoteModelsUseCase] 🔑 Erro de autenticação! Verifique se o token é válido.');
    } else if (error.message.includes('FORBIDDEN')) {
      console.error('[fetchRemoteModelsUseCase] 🚫 Acesso negado (permissão insuficiente)');
    } else if (error.message.includes('TIMEOUT')) {
      console.warn('[fetchRemoteModelsUseCase] ⏱️ Requisição expirou. Verifique a conectividade.');
    } else if (error.message.includes('NETWORK_ERROR')) {
      console.warn('[fetchRemoteModelsUseCase] 🌐 Erro de rede. Modo offline.');
    } else {
      console.warn('[fetchRemoteModelsUseCase] 🔄 Erro desconhecido. Mantendo modelos locais.');
    }
  }
};
