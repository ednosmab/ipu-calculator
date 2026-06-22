import { renderHook, act } from '@testing-library/react-native';
import { useSyncEngine } from '../useSyncEngine';

// --- Mocks for useSyncEngine dependencies ---

let mockIsConnected: boolean | null = null;
let mockAuthLoading = false;
let mockUser: { id: string; email: string } | null = null;

jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => mockIsConnected,
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isLoading: mockAuthLoading, user: mockUser }),
}));

const mockSyncModelsUseCase = jest.fn().mockResolvedValue(undefined);
const mockFetchRemoteModelsUseCase = jest.fn().mockResolvedValue(undefined);
const mockProcessPendingDeletesUseCase = jest.fn().mockResolvedValue(undefined);
const mockProcessPendingEditsUseCase = jest.fn().mockResolvedValue(undefined);

jest.mock('@/features/models/application/syncModelsUseCase', () => ({
  syncModelsUseCase: () => mockSyncModelsUseCase(),
  processPendingDeletesUseCase: () => mockProcessPendingDeletesUseCase(),
  processPendingEditsUseCase: () => mockProcessPendingEditsUseCase(),
}));

jest.mock('@/features/models/application/fetchRemoteModelsUseCase', () => ({
  fetchRemoteModelsUseCase: () => mockFetchRemoteModelsUseCase(),
}));

jest.mock('@/features/models/application/schemaMigrationService', () => ({
  schemaMigrationService: {
    migrateIfNeeded: jest.fn().mockResolvedValue({ migrated: false, count: 0 }),
  },
}));

jest.mock('@/core/device/deviceId', () => ({
  getDeviceId: jest.fn().mockResolvedValue('device-uuid-test-12345678'),
}));

jest.mock('@/core/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const DEFAULT_AUTH = {
  authLoading: false,
  user: { id: 'user-001', email: 'test@test.com' },
};

const countRunSyncCalls = () =>
  mockSyncModelsUseCase.mock.calls.length +
  mockFetchRemoteModelsUseCase.mock.calls.length +
  mockProcessPendingDeletesUseCase.mock.calls.length +
  mockProcessPendingEditsUseCase.mock.calls.length;

describe('useSyncEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConnected = null;
    mockAuthLoading = DEFAULT_AUTH.authLoading;
    mockUser = DEFAULT_AUTH.user;
  });

  describe('init effect', () => {
    it('2.1: should NOT run sync when isConnected starts as null (still verifying)', async () => {
      mockIsConnected = null;

      renderHook(() => useSyncEngine());

      await act(async () => {
        await Promise.resolve();
      });

      expect(countRunSyncCalls()).toBe(0);
    });

    it('runs init sync once when isConnected becomes true and user is loaded', async () => {
      mockIsConnected = null;

      const { rerender } = renderHook(() => useSyncEngine());

      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        mockIsConnected = true;
        rerender(undefined);
      });

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockSyncModelsUseCase).toHaveBeenCalledTimes(1);
      expect(mockFetchRemoteModelsUseCase).toHaveBeenCalledTimes(1);
      expect(mockProcessPendingDeletesUseCase).toHaveBeenCalledTimes(1);
      expect(mockProcessPendingEditsUseCase).toHaveBeenCalledTimes(1);
    });

    it('does NOT run init when user is null', async () => {
      mockIsConnected = true;
      mockUser = null;

      renderHook(() => useSyncEngine());

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockSyncModelsUseCase).not.toHaveBeenCalled();
    });

    it('does NOT run init while auth is loading', async () => {
      mockIsConnected = true;
      mockAuthLoading = true;

      renderHook(() => useSyncEngine());

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockSyncModelsUseCase).not.toHaveBeenCalled();
    });
  });

  describe('reconnect listener (wasOffline → true)', () => {
    it('2.2: runs sync when isConnected transitions null → true AFTER init (the bug fix)', async () => {
      mockIsConnected = true;

      const { rerender } = renderHook(() => useSyncEngine());

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockSyncModelsUseCase).toHaveBeenCalledTimes(1);

      mockSyncModelsUseCase.mockClear();
      mockFetchRemoteModelsUseCase.mockClear();
      mockProcessPendingDeletesUseCase.mockClear();
      mockProcessPendingEditsUseCase.mockClear();

      await act(async () => {
        mockIsConnected = null;
        rerender(undefined);
      });

      await act(async () => {
        mockIsConnected = true;
        rerender(undefined);
      });

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockSyncModelsUseCase).toHaveBeenCalledTimes(1);
      expect(mockFetchRemoteModelsUseCase).toHaveBeenCalledTimes(1);
    });

    it('2.3: runs sync when isConnected transitions false → true', async () => {
      mockIsConnected = true;

      const { rerender } = renderHook(() => useSyncEngine());

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      mockSyncModelsUseCase.mockClear();
      mockFetchRemoteModelsUseCase.mockClear();
      mockProcessPendingDeletesUseCase.mockClear();
      mockProcessPendingEditsUseCase.mockClear();

      await act(async () => {
        mockIsConnected = false;
        rerender(undefined);
      });

      await act(async () => {
        mockIsConnected = true;
        rerender(undefined);
      });

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockSyncModelsUseCase).toHaveBeenCalledTimes(1);
    });

    it('2.4: does NOT re-run sync when isConnected stays true (idempotent)', async () => {
      mockIsConnected = true;

      const { rerender } = renderHook(() => useSyncEngine());

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const callsAfterInit = countRunSyncCalls();
      expect(callsAfterInit).toBeGreaterThan(0);

      await act(async () => {
        rerender(undefined);
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(countRunSyncCalls()).toBe(callsAfterInit);
    });

    it('2.5: does NOT run sync on true → false transition', async () => {
      mockIsConnected = true;

      const { rerender } = renderHook(() => useSyncEngine());

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      mockSyncModelsUseCase.mockClear();
      mockFetchRemoteModelsUseCase.mockClear();
      mockProcessPendingDeletesUseCase.mockClear();
      mockProcessPendingEditsUseCase.mockClear();

      await act(async () => {
        mockIsConnected = false;
        rerender(undefined);
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockSyncModelsUseCase).not.toHaveBeenCalled();
      expect(mockFetchRemoteModelsUseCase).not.toHaveBeenCalled();
    });

    it('2.6: does NOT run sync on true → null transition (heartbeat reset)', async () => {
      mockIsConnected = true;

      const { rerender } = renderHook(() => useSyncEngine());

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      mockSyncModelsUseCase.mockClear();
      mockFetchRemoteModelsUseCase.mockClear();
      mockProcessPendingDeletesUseCase.mockClear();
      mockProcessPendingEditsUseCase.mockClear();

      await act(async () => {
        mockIsConnected = null;
        rerender(undefined);
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockSyncModelsUseCase).not.toHaveBeenCalled();
      expect(mockFetchRemoteModelsUseCase).not.toHaveBeenCalled();
    });

    it('2.7: does NOT run sync without user even with network', async () => {
      mockIsConnected = true;
      mockUser = null;

      renderHook(() => useSyncEngine());

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockSyncModelsUseCase).not.toHaveBeenCalled();
    });

    it('2.8: does NOT run sync while auth is loading', async () => {
      mockIsConnected = true;
      mockAuthLoading = true;

      renderHook(() => useSyncEngine());

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockSyncModelsUseCase).not.toHaveBeenCalled();
    });

    it('2.9: init + listener do NOT duplicate sync on boot (null → true)', async () => {
      mockIsConnected = null;

      const { rerender } = renderHook(() => useSyncEngine());

      await act(async () => {
        await Promise.resolve();
      });

      expect(countRunSyncCalls()).toBe(0);

      await act(async () => {
        mockIsConnected = true;
        rerender(undefined);
      });

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockSyncModelsUseCase).toHaveBeenCalledTimes(1);
      expect(mockFetchRemoteModelsUseCase).toHaveBeenCalledTimes(1);
      expect(mockProcessPendingDeletesUseCase).toHaveBeenCalledTimes(1);
      expect(mockProcessPendingEditsUseCase).toHaveBeenCalledTimes(1);
    });
  });
});
