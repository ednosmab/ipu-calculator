import { supabase } from '@/core/infra/supabaseClient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { fetchRemoteModelsUseCase } from '../application/fetchRemoteModelsUseCase';
import { CalculationModel } from '../domain/calculationModel';
import { modelRepository } from '../infra/modelRepository';

export const useRealtimeModels = () => {
  const [models, setModels] = useState<CalculationModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastSyncTime = useRef(0);
  const appState = useRef(AppState.currentState);

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
    setModels(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchModels(true);

    const unsubscribeRepo = modelRepository.subscribe(() => {
      fetchModels(false);
    });

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        fetchModels(true);
      }
      appState.current = nextAppState;
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase.channel('realtime-models');

      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'models' },
        (payload) => {
          fetchModels(true);
        }
      );

      channel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[useRealtimeModels]: Realtime indisponível. Operando em modo local.');
        } else if (status === 'SUBSCRIBED') {
          console.log('[useRealtimeModels]: Realtime conectado com sucesso.');
        }
      });
    } catch (e) {
      console.warn('[useRealtimeModels]: Erro ao configurar realtime, operando offline:', e);
    }

    return () => {
      unsubscribeRepo();
      appStateSubscription.remove();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchModels]);

  return { models, isLoading };
};