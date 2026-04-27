import { asyncStorageClient, STORAGE_KEYS } from '@/core/storage/asyncStorageClient';
import { CalculationModel } from '../domain/calculationModel';

export const SCHEMA_VERSION = '1.0.0';

export const schemaMigrationService = {
  async needsMigration(): Promise<boolean> {
    const savedVersion = await asyncStorageClient.get<string>('schema_version');
    return savedVersion !== SCHEMA_VERSION;
  },

  async getModels(): Promise<CalculationModel[]> {
    const models = await asyncStorageClient.get<CalculationModel[]>(STORAGE_KEYS.MODELS);
    return models ?? [];
  },

  async saveModels(models: CalculationModel[]): Promise<boolean> {
    return asyncStorageClient.set(STORAGE_KEYS.MODELS, models);
  },

  async migrateIfNeeded(): Promise<{ migrated: boolean; count: number }> {
    if (!(await this.needsMigration())) {
      return { migrated: false, count: 0 };
    }

    const models = await this.getModels();
    const pendingModels = models.filter(m => m.syncStatus === 'pending');

    if (pendingModels.length === 0) {
      await asyncStorageClient.set('schema_version', SCHEMA_VERSION);
      return { migrated: false, count: 0 };
    }

    // Mark all pending models for re-sync (increment updatedAt triggers new sync)
    const migratedModels = models.map(m => {
      if (m.syncStatus === 'pending') {
        return { ...m, updatedAt: Date.now() };
      }
      return m;
    });

    await this.saveModels(migratedModels);
    await asyncStorageClient.set('schema_version', SCHEMA_VERSION);

    return { migrated: true, count: pendingModels.length };
  },

  async resetSchemaVersion(): Promise<void> {
    await asyncStorageClient.remove('schema_version');
  },
};