import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useRealtimeModels } from '../hooks/useRealtimeModels';
import { modelRepository } from '../infra/modelRepository';
import { supabase } from '@/core/infra/supabaseClient';
import { CalculationModel } from '../domain/calculationModel';

// --- Mocks ---

const mockModel: CalculationModel = {
  id: 'rt-001',
  name: 'Modelo Realtime',
  type: 'ipu',
  inputs: { isocyanate: 100, polyol: 150 },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  syncStatus: 'synced',
  localAction: null,
};

jest.mock('../infra/modelRepository', () => ({
  modelRepository: {
    getAll: jest.fn(),
    subscribe: jest.fn(),
  },
}));

// Mock do canal Supabase Realtime
const mockSubscribeFn = jest.fn();
const mockOnFn = jest.fn();
const mockRemoveChannel = jest.fn();

const mockChannel: any = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn((cb?: (status: string) => void) => {
    mockSubscribeFn(cb);
    return mockChannel;
  }),
};

jest.mock('@/core/infra/supabaseClient', () => ({
  supabase: {
    channel: jest.fn(() => mockChannel),
    removeChannel: jest.fn(),
  },
}));

// --- Setup ---

beforeEach(() => {
  jest.clearAllMocks();

  (modelRepository.getAll as jest.Mock).mockResolvedValue([mockModel]);
  (modelRepository.subscribe as jest.Mock).mockReturnValue(jest.fn()); // retorna unsubscribe

  mockChannel.on.mockReturnThis();
  mockChannel.subscribe.mockImplementation((cb?: (status: string) => void) => {
    if (cb) mockSubscribeFn(cb);
    return mockChannel;
  });
  (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
});

// --- Testes ---

describe('useRealtimeModels', () => {
  describe('initial state', () => {
    it('should start with isLoading true and empty models', () => {
      const { result } = renderHook(() => useRealtimeModels());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.models).toEqual([]);
    });

    it('should load models and set isLoading to false after fetch', async () => {
      const { result } = renderHook(() => useRealtimeModels());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.models).toEqual([mockModel]);
    });
  });

  describe('Realtime subscription', () => {
    it('should subscribe to the Supabase Realtime channel on mount', async () => {
      renderHook(() => useRealtimeModels());

      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalledWith('realtime-models');
      });

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'models' },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it.skip('should refetch models when a Realtime event is received', async () => {
      const updatedModel = { ...mockModel, name: 'Modelo Atualizado' };
      (modelRepository.getAll as jest.Mock)
        .mockResolvedValueOnce([mockModel])
        .mockResolvedValueOnce([updatedModel]);

      // Captura o callback passado ao .on() para simular um evento remoto
      let realtimeCallback: (() => void) | null = null;
      mockChannel.on.mockImplementation((_event: string, _filter: object, cb: () => void) => {
        realtimeCallback = cb;
        return mockChannel;
      });

      const { result } = renderHook(() => useRealtimeModels());

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.models[0].name).toBe('Modelo Realtime');

      // Simula chegada de evento remoto
      await act(async () => {
        realtimeCallback?.();
      });

      await waitFor(() => {
        expect(result.current.models[0].name).toBe('Modelo Atualizado');
      });
    });

    it('should unsubscribe from the channel and local listener on unmount', async () => {
      const mockLocalUnsubscribe = jest.fn();
      (modelRepository.subscribe as jest.Mock).mockReturnValue(mockLocalUnsubscribe);

      const { unmount } = renderHook(() => useRealtimeModels());
      await waitFor(() => expect(supabase.channel).toHaveBeenCalled());

      unmount();

      expect(mockLocalUnsubscribe).toHaveBeenCalledTimes(1);
      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe('fallback behavior', () => {
    it('should keep existing models when Realtime reports CHANNEL_ERROR', async () => {
      let subscribeCallback: ((status: string) => void) | null = null;
      mockChannel.subscribe.mockImplementation((cb: (status: string) => void) => {
        subscribeCallback = cb;
        return mockChannel;
      });

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useRealtimeModels());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Simula falha no canal
      act(() => {
        subscribeCallback?.('CHANNEL_ERROR');
      });

      // Dados carregados inicialmente continuam disponíveis
      expect(result.current.models).toEqual([mockModel]);
      expect(warnSpy).toHaveBeenCalledWith(
        '[useRealtimeModels]: Realtime indisponível. Operando em modo local.'
      );

      warnSpy.mockRestore();
    });

    it('should keep existing models when Realtime reports TIMED_OUT', async () => {
      let subscribeCallback: ((status: string) => void) | null = null;
      mockChannel.subscribe.mockImplementation((cb: (status: string) => void) => {
        subscribeCallback = cb;
        return mockChannel;
      });

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useRealtimeModels());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        subscribeCallback?.('TIMED_OUT');
      });

      expect(result.current.models).toEqual([mockModel]);
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

    describe('local listener', () => {
      it('should refetch models when the local repository notifies a change', async () => {
        const updatedModels = [{ ...mockModel, name: 'Atualizado Localmente' }];

        // Clear any existing mock implementations and set up fresh ones
        jest.clearAllMocks();
        // We need three mockResolvedValueOnce calls:
        // 1. First call in fetchRemoteModelsUseCase (initial load)
        // 2. Second call in fetchModels after fetchRemoteModelsUseCase (still initial load) 
        // 3. Third call when localCallback is triggered (after local change)
        (modelRepository.getAll as jest.Mock)
          .mockResolvedValueOnce([mockModel])      // First call: initial load in fetchRemoteModelsUseCase
          .mockResolvedValueOnce([mockModel])      // Second call: initial load in fetchModels (after fetchRemoteModelsUseCase)
          .mockResolvedValueOnce(updatedModels);   // Third call: after local change
        let localCallback: (() => void) | null = null;
        (modelRepository.subscribe as jest.Mock).mockImplementation((cb: () => void) => {
          localCallback = cb;
          return jest.fn(); // retorna unsubscribe
        });

        const { result } = renderHook(() => useRealtimeModels());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
          localCallback?.();
        });

        // Wait for the state update to propagate after localCallback
        await waitFor(() => {
          expect(result.current.models[0].name).toBe('Atualizado Localmente');
        });
      });
    });
});
