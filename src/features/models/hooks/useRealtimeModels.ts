import { supabase } from '@/core/infra/supabaseClient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { fetchRemoteModelsUseCase } from '../application/fetchRemoteModelsUseCase';
import { CalculationModel } from '../domain/calculationModel';
import { modelRepository } from '../infra/modelRepository';
import { useAuth } from '@/hooks/useAuth';
import { sessionStorage } from '@/core/auth/sessionStorage';

export const useRealtimeModels = () => {
  const [models, setModels] = useState<CalculationModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const lastSyncTime = useRef(0);
  const appState = useRef(AppState.currentState);

  const { isLoading: authLoading, user, profile } = useAuth();

  const fetchModels = useCallback(
    async (fromRemote = false) => {
      if (authLoading) {
        console.log('[useRealtimeModels] Esperando AuthProvider finalizar...');
        return;
      }

      if (fromRemote) {
        const now = Date.now();
        if (now - lastSyncTime.current < 1000) {
          return;
        }
        lastSyncTime.current = now;

        if (!user) {
          console.warn('[useRealtimeModels] Sem usuário autenticado; ignorando sync remota');
        } else {
          console.log('[useRealtimeModels] Sincronizando modelos remotos...', {
            userId: user.id,
            userRole: profile?.role,
          });

          try {
            await fetchRemoteModelsUseCase();
          } catch (error) {
            console.error('[useRealtimeModels] Erro ao sincronizar:', error);
          }
        }
      }

      const data = await modelRepository.getAll();
      setModels(data);
      setLastUpdate(Date.now());
      setIsLoading(false);
    },
    [authLoading, user, profile]
  );

  useEffect(() => {
    console.log('[useRealtimeModels] Inicializando...', {
      authLoading,
      hasUser: !!user,
      userRole: profile?.role,
    });

    if (authLoading) {
      console.log('[useRealtimeModels] AuthProvider ainda carregando, aguardando...');
      return;
    }

    if (!user) {
      console.warn('[useRealtimeModels] Nenhum usuário; carregando apenas cache local');
      fetchModels(false);
    } else {
      fetchModels(true);
    }

    const unsubscribeRepo = modelRepository.subscribe(() => {
      console.log('[useRealtimeModels] Repository mudou, refrescando dados locais...');
      fetchModels(false);
    });

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[useRealtimeModels] App retornou do background');
        fetchModels(true);
      }
      appState.current = nextAppState;
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[useRealtimeModels] Aba ficou visível');
        fetchModels(true);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      // Sincroniza o token de auth do AuthProvider com o cliente Supabase
      // usado para Realtime. Sem isso, o WebSocket conecta como anônimo
      // e o RLS (TO authenticated em models) bloqueia os payloads.
      // Try/catch protege contra ambientes sem sessionStorage (testes jsdom
      // antigos, SSR, etc.) sem derrubar a renderização.
      try {
        sessionStorage.getToken().then((token) => {
          if (token) {
            try {
              supabase.realtime.setAuth(token);
              console.log('[useRealtimeModels] Token sincronizado com realtime client');
            } catch (err) {
              console.warn('[useRealtimeModels] Falha ao setar auth no realtime:', err);
            }
          } else {
            console.warn('[useRealtimeModels] Sem token; realtime operará como anônimo (payloads bloqueados por RLS)');
          }
        });
      } catch (storageError) {
        console.warn('[useRealtimeModels] sessionStorage indisponível:', storageError);
      }

      channel = supabase.channel('realtime-models');

      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'models' },
        (payload) => {
          console.log('[useRealtimeModels] Notificação realtime recebida:', payload.eventType);
          fetchModels(true);
        }
      );

      channel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[useRealtimeModels] Realtime indisponível. Operando em modo local.');
        } else if (status === 'SUBSCRIBED') {
          console.log('[useRealtimeModels] ✅ Realtime conectado com sucesso.');
        }
      });
    } catch (e) {
      console.warn('[useRealtimeModels] Erro ao configurar realtime:', e);
    }

    return () => {
      unsubscribeRepo();
      appStateSubscription.remove();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [authLoading, user, profile, fetchModels]);

  return { models, isLoading, lastUpdate };
};
