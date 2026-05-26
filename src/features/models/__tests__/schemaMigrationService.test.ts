import { schemaMigrationService } from '../application/schemaMigrationService';
import { asyncStorageClient, STORAGE_KEYS } from '@/core/storage/asyncStorageClient';
import { CACHE_VERSION } from '@/core/versioning/cacheVersion';
import { CalculationModel } from '../domain/calculationModel';

const mockPendingModel: CalculationModel = {
  id: 'pending-1',
  name: 'Modelo Pendente',
  type: 'ipu',
  inputs: { isocyanate: 100, polyol: 150 },
  createdAt: Date.now() - 10000,
  updatedAt: Date.now() - 10000,
  version: 1,
  syncStatus: 'pending',
  localAction: 'created' as const,
};

const mockSyncedModel: CalculationModel = {
  id: 'synced-1',
  name: 'Modelo Sincronizado',
  type: 'calibration',
  inputs: { targetWeight: 1000, machineValue: 100, actualWeight: 900 },
  createdAt: Date.now() - 10000,
  updatedAt: Date.now() - 10000,
  version: 2,
  syncStatus: 'synced',
  localAction: null,
};

describe('Schema Migration Service', () => {
  beforeEach(async () => {
    await asyncStorageClient.remove(STORAGE_KEYS.CACHE_VERSION);
    await asyncStorageClient.remove(STORAGE_KEYS.MODELS);
  });

  afterEach(async () => {
    await asyncStorageClient.remove(STORAGE_KEYS.CACHE_VERSION);
    await asyncStorageClient.remove(STORAGE_KEYS.MODELS);
  });

  describe('needsMigration', () => {
    it('should return true when no schema version is saved', async () => {
      const needs = await schemaMigrationService.needsMigration();
      expect(needs).toBe(true);
    });

    it('should return false when schema version matches', async () => {
      await asyncStorageClient.set(STORAGE_KEYS.CACHE_VERSION, CACHE_VERSION.SCHEMA);
      const needs = await schemaMigrationService.needsMigration();
      expect(needs).toBe(false);
    });

    it('should return true when schema version is different', async () => {
      await asyncStorageClient.set(STORAGE_KEYS.CACHE_VERSION, '0.9.0');
      const needs = await schemaMigrationService.needsMigration();
      expect(needs).toBe(true);
    });
  });

  describe('migrateIfNeeded', () => {
    it('should not migrate when schema is up to date', async () => {
      await asyncStorageClient.set(STORAGE_KEYS.CACHE_VERSION, CACHE_VERSION.SCHEMA);
      const result = await schemaMigrationService.migrateIfNeeded();
      expect(result.migrated).toBe(false);
      expect(result.count).toBe(0);
    });

    it('should not migrate when there are no pending models', async () => {
      await asyncStorageClient.set(STORAGE_KEYS.MODELS, [mockSyncedModel]);
      const result = await schemaMigrationService.migrateIfNeeded();
      expect(result.migrated).toBe(false);
      expect(result.count).toBe(0);
    });

    it('should migrate pending models when schema version is outdated', async () => {
      await asyncStorageClient.set(STORAGE_KEYS.MODELS, [mockPendingModel, mockSyncedModel]);

      const result = await schemaMigrationService.migrateIfNeeded();

      expect(result.migrated).toBe(true);
      expect(result.count).toBe(1);
    });

    it('should update pending models updatedAt to trigger re-sync', async () => {
      const originalUpdatedAt = mockPendingModel.updatedAt;
      await asyncStorageClient.set(STORAGE_KEYS.MODELS, [mockPendingModel]);

      await schemaMigrationService.migrateIfNeeded();

      const models = await schemaMigrationService.getModels();
      const migratedModel = models.find(m => m.id === 'pending-1');
      expect(migratedModel!.updatedAt).toBeGreaterThan(originalUpdatedAt);
    });

    it('should preserve synced models unchanged', async () => {
      const syncedUpdatedAt = mockSyncedModel.updatedAt;
      await asyncStorageClient.set(STORAGE_KEYS.MODELS, [mockPendingModel, mockSyncedModel]);

      await schemaMigrationService.migrateIfNeeded();

      const models = await schemaMigrationService.getModels();
      const synced = models.find(m => m.id === 'synced-1');
      expect(synced!.updatedAt).toBe(syncedUpdatedAt);
    });

    it('should update schema version after migration', async () => {
      await asyncStorageClient.set(STORAGE_KEYS.MODELS, [mockPendingModel]);

      await schemaMigrationService.migrateIfNeeded();

      const needs = await schemaMigrationService.needsMigration();
      expect(needs).toBe(false);
    });

    it('should handle multiple pending models', async () => {
      const pendingModels = [
        { ...mockPendingModel, id: 'pending-1' },
        { ...mockPendingModel, id: 'pending-2' },
        { ...mockPendingModel, id: 'pending-3' },
      ];
      await asyncStorageClient.set(STORAGE_KEYS.MODELS, [...pendingModels, mockSyncedModel]);

      const result = await schemaMigrationService.migrateIfNeeded();

      expect(result.count).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle empty models array', async () => {
      await asyncStorageClient.set(STORAGE_KEYS.MODELS, []);

      const result = await schemaMigrationService.migrateIfNeeded();

      expect(result.migrated).toBe(false);
      expect(result.count).toBe(0);
    });

    it('should handle null models (no key in storage)', async () => {
      const result = await schemaMigrationService.migrateIfNeeded();
      expect(result.migrated).toBe(false);
      expect(result.count).toBe(0);
    });
  });
});