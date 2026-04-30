import { supabase } from '@/core/infra/supabaseClient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { fetchRemoteModelsUseCase } from '../application/fetchRemoteModelsUseCase';
import { CalculationModel } from '../domain/calculationModel';
import { modelRepository } from '../infra/modelRepository';
import { logger } from '@/core/logging/logger';

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
    logger.info('[useRealtimeModels] Modelos carregados:', data.length);
    setModels(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    logger.info('[useRealtimeModels] Iniciando...');
    fetchModels(true);

    const unsubscribeRepo = modelRepository.subscribe(() => {
      console.log('[useRealtimeModels] 💥 Listener executado, chamando fetchModels...');
      logger.info('[useRealtimeModels] Notificado via repo, recarregando...');
      fetchModels(false);
    });

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        logger.info('[useRealtimeModels] App voltou ao foreground, sincronizando...');
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
          logger.info('[useRealtimeModels] Evento Realtime:', payload.eventType);
          fetchModels(true);
        }
      );

      channel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.warn('[useRealtimeModels]: Realtime indisponível. Operando em modo local.');
        } else if (status === 'SUBSCRIBED') {
          logger.info('[useRealtimeModels]: Realtime conectado com sucesso.');
        }
      });
    } catch (e) {
      logger.warn('[useRealtimeModels]: Erro ao configurar realtime, operando offline:', e);
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