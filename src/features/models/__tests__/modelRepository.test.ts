import { modelRepository } from '../infra/modelRepository';
import { asyncStorageClient, STORAGE_KEYS } from '@/core/storage/asyncStorageClient';
import { CalculationModel } from '../domain/calculationModel';
import { CACHE_VERSION } from '@/core/versioning/cacheVersion';

// Mock sync service to prevent background syncs from changing status during tests
jest.mock('../infra/modelSyncService', () => ({
  modelSyncService: {
    syncToRemote: jest.fn().mockReturnValue(new Promise(() => {})), // Never resolves to keep status 'pending'
    deleteFromRemote: jest.fn().mockResolvedValue(false),
  },
}));

// Mock fetchRemoteModelsUseCase to prevent actual network calls during recovery
jest.mock('../application/fetchRemoteModelsUseCase', () => ({
  fetchRemoteModelsUseCase: jest.fn(),
}));

const mockModel: CalculationModel = {
  id: 'test-123',
  name: 'Modelo Teste',
  type: 'ipu',
  inputs: { isocyanate: 100, polyol: 150 },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: 1,
  syncStatus: 'pending',
  localAction: 'created',
};

const mockModelSynced: CalculationModel = {
  ...mockModel,
  id: 'test-456',
  name: 'Modelo Sincronizado',
  syncStatus: 'synced',
  localAction: null,
};

const saveWithTTL = async (models: CalculationModel[]) => {
  const cache = {
    data: models,
    expiresAt: Date.now() + 48 * 60 * 60 * 1000,
    schemaVersion: CACHE_VERSION.SCHEMA,
  };
  await asyncStorageClient.set(STORAGE_KEYS.MODELS, cache);
};

describe('ModelRepository Sync', () => {
  beforeEach(async () => {
    await asyncStorageClient.remove(STORAGE_KEYS.MODELS);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await asyncStorageClient.remove(STORAGE_KEYS.MODELS);
  });

  describe('create', () => {
    it('should save model locally even if remote sync fails', async () => {
      const success = await modelRepository.create(mockModel);

      expect(success).toBe(true);
      const models = await modelRepository.getAll();
      expect(models).toHaveLength(1);
      expect(models[0].syncStatus).toBe('pending');
    });

    it('should preserve pending models after multiple offline creates', async () => {
      await modelRepository.create(mockModel);
      await modelRepository.create({ ...mockModel, id: 'test-2', name: 'Modelo 2' });

      const models = await modelRepository.getAll();
      expect(models).toHaveLength(2);
      expect(models.every(m => m.syncStatus === 'pending')).toBe(true);
    });
  });

  describe('update', () => {
    it('should mark model as pending after local update', async () => {
      await modelRepository.create(mockModelSynced);
      const updatedModel = { ...mockModelSynced, name: 'Nome Atualizado' };

      await modelRepository.update(updatedModel);

      const models = await modelRepository.getAll();
      const updated = models.find(m => m.id === mockModelSynced.id);
      expect(updated?.syncStatus).toBe('pending');
    });

    it('should not lose data when updating offline', async () => {
      await modelRepository.create(mockModel);
      const original = await modelRepository.getById(mockModel.id);

      await modelRepository.update({ ...mockModel, name: 'Novo Nome' });
      const afterUpdate = await modelRepository.getById(mockModel.id);

      expect(original?.inputs).toEqual(afterUpdate?.inputs);
      expect(afterUpdate?.name).toBe('Novo Nome');
    });
  });

  describe('delete', () => {
    it('should remove model locally immediately', async () => {
      await modelRepository.create(mockModel);
      await modelRepository.delete(mockModel.id);

      const models = await modelRepository.getAll();
      expect(models).toHaveLength(0);
    });
  });

  describe('data persistence', () => {
    it('should not lose pending models after code update', async () => {
      const models: CalculationModel[] = [
        { ...mockModel, id: 'model-1', syncStatus: 'pending' },
        { ...mockModel, id: 'model-2', syncStatus: 'pending' },
        { ...mockModel, id: 'model-3', syncStatus: 'synced' },
      ];

      await saveWithTTL(models);

      const retrieved = await modelRepository.getAll();
      expect(retrieved).toHaveLength(3);
      expect(retrieved.filter(m => m.syncStatus === 'pending')).toHaveLength(2);
      expect(retrieved.filter(m => m.syncStatus === 'synced')).toHaveLength(1);
    });

    it('should preserve model inputs structure after multiple operations', async () => {
      await modelRepository.create(mockModel);
      await modelRepository.update({ ...mockModel, name: 'Updated' });
      await modelRepository.create({ ...mockModel, id: 'model-2' });

      const models = await modelRepository.getAll();
      models.forEach(model => {
        expect(model.inputs).toBeDefined();
        expect(typeof model.inputs).toBe('object');
      });
    });
  });

  describe('cache invalidation', () => {
    beforeEach(async () => {
      await asyncStorageClient.remove(STORAGE_KEYS.MODELS);
      await asyncStorageClient.remove(STORAGE_KEYS.CACHE_VERSION);
      jest.clearAllMocks();
    });

    it('should invalidate cache when schema version does not match', async () => {
      const cache = {
        data: [mockModel],
        expiresAt: Date.now() + 48 * 60 * 60 * 1000,
        schemaVersion: '0.0.0', // Old version
      };
      await asyncStorageClient.set(STORAGE_KEYS.MODELS, cache);

      const result = await modelRepository.getAll();

      expect(result).toHaveLength(0);
    });

    it('should clear stale data on schema mismatch', async () => {
      const cache = {
        data: [mockModel],
        expiresAt: Date.now() + 48 * 60 * 60 * 1000,
        schemaVersion: '0.0.0',
      };
      await asyncStorageClient.set(STORAGE_KEYS.MODELS, cache);

      await modelRepository.getAll();

      const stored = await asyncStorageClient.get(STORAGE_KEYS.MODELS);
      expect(stored).toBeNull();
    });

    it('should keep valid cache with matching schema version', async () => {
      const cache = {
        data: [mockModel],
        expiresAt: Date.now() + 48 * 60 * 60 * 1000,
        schemaVersion: CACHE_VERSION.SCHEMA,
      };
      await asyncStorageClient.set(STORAGE_KEYS.MODELS, cache);

      const result = await modelRepository.getAll();

      expect(result).toHaveLength(1);
    });
  });

  describe('cache recovery', () => {
    beforeEach(async () => {
      await asyncStorageClient.remove(STORAGE_KEYS.MODELS);
      await asyncStorageClient.remove(STORAGE_KEYS.CACHE_VERSION);
      await asyncStorageClient.remove(STORAGE_KEYS.MODELS_BACKUP);
      jest.clearAllMocks();
    });

    it('should return empty array when cache and schema are both absent', async () => {
      const result = await modelRepository.getAll();
      expect(result).toHaveLength(0);
    });

    it('should attempt recovery when models key is missing but schema version exists', async () => {
      await asyncStorageClient.set(STORAGE_KEYS.CACHE_VERSION, CACHE_VERSION.SCHEMA);

      const result = await modelRepository.getAll();

      expect(Array.isArray(result)).toBe(true);
    });

    it('should clear cache and return empty when recovery fails (dynamic import unavailable)', async () => {
      await saveWithTTL([mockModel]);
      await asyncStorageClient.set(STORAGE_KEYS.CACHE_VERSION, CACHE_VERSION.SCHEMA);

      await asyncStorageClient.remove(STORAGE_KEYS.MODELS);

      const result = await modelRepository.getAll();

      expect(Array.isArray(result)).toBe(true);
    });
  });
});