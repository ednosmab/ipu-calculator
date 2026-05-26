import { asyncStorageClient, STORAGE_KEYS } from '@/core/storage/asyncStorageClient';
import { CACHE_VERSION } from '@/core/versioning/cacheVersion';
import { CalculationModel } from '../domain/calculationModel';

export const schemaMigrationService = {
  async needsMigration(): Promise<boolean> {
    const savedVersion = await asyncStorageClient.get<string>(STORAGE_KEYS.CACHE_VERSION);
    return savedVersion !== CACHE_VERSION.SCHEMA;
  },

  async getModels(): Promise<CalculationModel[]> {
    const raw = await asyncStorageClient.get<unknown>(STORAGE_KEYS.MODELS);
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw as CalculationModel[];
    }
    return (raw as { data: CalculationModel[] })?.data ?? [];
  },

  async saveModels(models: CalculationModel[]): Promise<boolean> {
    return asyncStorageClient.set(STORAGE_KEYS.MODELS, {
      data: models,
      expiresAt: 0,
      schemaVersion: CACHE_VERSION.SCHEMA,
    });
  },

  async migrateIfNeeded(): Promise<{ migrated: boolean; count: number }> {
    if (!(await this.needsMigration())) {
      return { migrated: false, count: 0 };
    }

    const models = await this.getModels();
    const pendingModels = models.filter(m => m.syncStatus === 'pending');

    if (pendingModels.length === 0) {
      await asyncStorageClient.set(STORAGE_KEYS.CACHE_VERSION, CACHE_VERSION.SCHEMA);
      return { migrated: false, count: 0 };
    }

    const migratedModels = models.map(m => {
      const base = { ...m, version: m.version ?? 1 };
      if (m.syncStatus === 'pending') {
        return { ...base, updatedAt: Date.now() };
      }
      return base;
    });

    await this.saveModels(migratedModels);
    await asyncStorageClient.set(STORAGE_KEYS.CACHE_VERSION, CACHE_VERSION.SCHEMA);

    return { migrated: true, count: pendingModels.length };
  },

  async resetSchemaVersion(): Promise<void> {
    await asyncStorageClient.remove(STORAGE_KEYS.CACHE_VERSION);
  },
};