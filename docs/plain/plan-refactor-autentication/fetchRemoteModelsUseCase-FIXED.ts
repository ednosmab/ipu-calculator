// ===== CORREÇÃO RÁPIDA #3: fetchRemoteModelsUseCase.ts =====
// Melhorar tratamento de erros e logging

// src/features/models/application/fetchRemoteModelsUseCase.ts

import { edgeFunctionsClient } from '@/core/api/edgeFunctionsClient';
import { modelRepository } from '../infra/modelRepository';
import { CalculationModel } from '../domain/calculationModel';

/**
 * Busca modelos do servidor e faz merge com modelos locais.
 * Usa last-write-wins strategy para resolver conflitos.
 */
export const fetchRemoteModelsUseCase = async (): Promise<void> => {
  console.log('[fetchRemoteModelsUseCase] Iniciando busca de modelos remotos...');

  try {
    // ✅ NOVO: Log antes da requisição
    console.log('[fetchRemoteModelsUseCase] Chamando edgeFunctionsClient.getModels()');
    const data = await edgeFunctionsClient.getModels();

    // ✅ NOVO: Validar resposta
    console.log('[fetchRemoteModelsUseCase] Resposta recebida:', {
      modelCount: data?.length ?? 0,
      models: data?.map(m => ({ id: m.id, name: m.name })),
    });

    await modelRepository.saveWithLock(
      await (async () => {
        const localModels = await modelRepository.getAll();

        // ✅ NOVO: Log de modelos locais
        console.log('[fetchRemoteModelsUseCase] Modelos locais:', {
          count: localModels.length,
          models: localModels.map(m => ({ 
            id: m.id, 
            name: m.name, 
            syncStatus: m.syncStatus 
          })),
        });

        let updated: CalculationModel[] = [...localModels];

        if (data && data.length > 0) {
          const remoteModels: CalculationModel[] = data.map((item) => ({
            id: item.id,
            name: item.name,
            type: item.type,
            inputs: item.inputs,
            createdAt: new Date(item.created_at).getTime(),
            updatedAt: new Date(item.updated_at).getTime(),
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
              // Modelo existe localmente
              if (rm.updatedAt > updated[localIndex].updatedAt) {
                console.log(`[fetchRemoteModelsUseCase] Atualizando modelo: ${rm.name}`);
                updated[localIndex] = rm;
                mergedCount++;
              }
            } else {
              // Novo modelo remoto
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
        }

        // Remove modelos que não existem mais remotamente (exceto os com operações pendentes)
        const remoteIds = data ? new Set(data.map((m) => m.id)) : new Set<string>();
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

    // ✅ NOVO: Diferenciar tipos de erro
    console.error('[fetchRemoteModelsUseCase] ❌ Erro durante sincronização:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Identifica tipo de erro para logging melhorado
    if (error.message.includes('UNAUTHORIZED') || error.message.includes('NO_TOKEN')) {
      console.error('[fetchRemoteModelsUseCase] 🔑 Erro de autenticação! Verifique se o token é válido.');
      // ✅ OPCIONAL: Redirecionar para login
      // await sessionStorage.clearAll();
      // throw error; // Re-lança para que a UI trate
    } else if (error.message.includes('FORBIDDEN')) {
      console.error('[fetchRemoteModelsUseCase] 🚫 Acesso negado (permissão insuficiente)');
    } else if (error.message.includes('TIMEOUT')) {
      console.warn('[fetchRemoteModelsUseCase] ⏱️ Requisição expirou. Verifique a conectividade.');
    } else if (error.message.includes('NETWORK_ERROR')) {
      console.warn('[fetchRemoteModelsUseCase] 🌐 Erro de rede. Modo offline.');
    } else {
      console.warn('[fetchRemoteModelsUseCase] 🔄 Erro desconhecido. Mantendo modelos locais.');
    }

    // ✅ NÃO relança o erro — permite que a app continue funcionar offline
    // Modelos locais são mantidos automaticamente
  }
};
