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

const mockModel: CalculationModel = {
  id: 'test-123',
  name: 'Modelo Teste',
  type: 'ipu',
  inputs: { isocyanate: 100, polyol: 150 },
  createdAt: Date.now(),
  updatedAt: Date.now(),
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
});