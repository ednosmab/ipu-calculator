import { modelSyncService } from '../modelSyncService';
import { edgeFunctionsClient } from '@/core/api/edgeFunctionsClient';
import { logger } from '@/core/logging/logger';
import { CalculationModel } from '../../domain/calculationModel';

jest.mock('@/core/api/edgeFunctionsClient', () => ({
  edgeFunctionsClient: {
    syncModel: jest.fn(),
    deleteModel: jest.fn(),
  },
}));

jest.mock('@/core/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockModel: CalculationModel = {
  id: 'test-sync-001',
  name: 'Modelo Sync Test',
  type: 'ipu',
  inputs: { isocyanate: 0.0771, polyol: 0.1506 },
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
  version: 1,
  syncStatus: 'pending',
  localAction: 'created',
};

const setNavigatorOnline = (value: boolean | undefined) => {
  if (value === undefined) {
    Object.defineProperty(globalThis, 'navigator', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  } else {
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: value },
      configurable: true,
      writable: true,
    });
  }
};

describe('modelSyncService.syncToRemote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setNavigatorOnline(true);
  });

  afterEach(() => {
    setNavigatorOnline(true);
  });

  it('1.1: returns false and logs warn when navigator.onLine is false', async () => {
    setNavigatorOnline(false);
    const syncSpy = edgeFunctionsClient.syncModel as jest.Mock;

    const result = await modelSyncService.syncToRemote(mockModel);

    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('navigator.onLine=false')
    );
    expect(syncSpy).not.toHaveBeenCalled();
  });

  it('1.2: does NOT call edgeFunctionsClient.syncModel when offline', async () => {
    setNavigatorOnline(false);
    const syncSpy = edgeFunctionsClient.syncModel as jest.Mock;

    await modelSyncService.syncToRemote(mockModel);

    expect(syncSpy).not.toHaveBeenCalled();
  });

  it('1.3: returns true and logs info when sync succeeds', async () => {
    (edgeFunctionsClient.syncModel as jest.Mock).mockResolvedValue(true);

    const result = await modelSyncService.syncToRemote(mockModel);

    expect(result).toBe(true);
    expect(logger.info).toHaveBeenCalledWith(
      '[EdgeFunctions] Modelo sincronizado com sucesso.'
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('1.4: returns false and logs error when sync fails', async () => {
    (edgeFunctionsClient.syncModel as jest.Mock).mockResolvedValue(false);

    const result = await modelSyncService.syncToRemote(mockModel);

    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      '[EdgeFunctions] Falha ao sincronizar modelo.'
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('forwards model fields correctly to edgeFunctionsClient.syncModel', async () => {
    (edgeFunctionsClient.syncModel as jest.Mock).mockResolvedValue(true);

    await modelSyncService.syncToRemote(mockModel);

    expect(edgeFunctionsClient.syncModel).toHaveBeenCalledWith({
      id: mockModel.id,
      name: mockModel.name,
      type: mockModel.type,
      inputs: mockModel.inputs,
      version: mockModel.version,
      updated_at: new Date(mockModel.updatedAt).toISOString(),
    });
  });
});

describe('modelSyncService.deleteFromRemote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setNavigatorOnline(true);
  });

  afterEach(() => {
    setNavigatorOnline(true);
  });

  it('returns false and logs warn when navigator.onLine is false', async () => {
    setNavigatorOnline(false);
    const deleteSpy = edgeFunctionsClient.deleteModel as jest.Mock;

    const result = await modelSyncService.deleteFromRemote('id-123');

    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Delete abortado')
    );
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('returns true and does NOT log error when delete succeeds', async () => {
    (edgeFunctionsClient.deleteModel as jest.Mock).mockResolvedValue(true);

    const result = await modelSyncService.deleteFromRemote('id-123');

    expect(result).toBe(true);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('returns false and logs error when delete fails', async () => {
    (edgeFunctionsClient.deleteModel as jest.Mock).mockResolvedValue(false);

    const result = await modelSyncService.deleteFromRemote('id-123');

    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      '[EdgeFunctions] Falha ao deletar modelo.'
    );
  });
});
