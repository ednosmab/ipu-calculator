import { supabase } from '@/core/infra/supabaseClient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRemoteModelsUseCase } from '../application/fetchRemoteModelsUseCase';
import { CalculationModel } from '../domain/calculationModel';
import { modelRepository } from '../infra/modelRepository';

export const useRealtimeModels = () => {
  const [models, setModels] = useState<CalculationModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastSyncTime = useRef(0);

  const fetchModels = useCallback(async (fromRemote = false) => {
    if (fromRemote) {
      const now = Date.now();
      if (now - lastSyncTime.current < 1000) {
        return;
      }
      lastSyncTime.current = now;
      await fetchRemoteModelsUseCase();
    }
    const data = await modelRepository.getAll();
    console.log('[useRealtimeModels] Modelos carregados:', data.length);
    setModels(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    console.log('[useRealtimeModels] Iniciando...');
    fetchModels(true);

    const unsubscribeRepo = modelRepository.subscribe(() => {
      console.log('[useRealtimeModels] Notificado via repo, recarregando...');
      fetchModels(false);
    });

    const channel = supabase
      .channel('realtime-models')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'models' },
        () => {
          fetchModels(true);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[useRealtimeModels]: Realtime indisponível. Operando em modo local.');
        }
      });

    return () => {
      unsubscribeRepo();
      supabase.removeChannel(channel);
    };
  }, [fetchModels]);

  return { models, isLoading };
};