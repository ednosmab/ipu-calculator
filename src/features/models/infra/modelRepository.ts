import { asyncStorageClient, STORAGE_KEYS } from '@/core/storage/asyncStorageClient';
import { CalculationModel, ModelType } from '../domain/calculationModel';
import { createPendingOperation, createPendingDelete, PendingOperation, MAX_ATTEMPTS } from '../domain/pendingOperation';
import { modelSyncService } from './modelSyncService';
import { pendingOpsService } from './pendingOpsService';
import { logger } from '@/core/logging/logger';

const MODEL_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

// Simple async mutex to prevent race conditions on concurrent write operations
let writeQueue: Promise<unknown> = Promise.resolve();
const withWriteLock = <T>(fn: () => Promise<T>): Promise<T> => {
  const next = writeQueue.then(fn).catch((err) => {
    writeQueue = Promise.resolve(); // Reset queue on error
    throw err; // Re-throw to inform caller
  });
  writeQueue = next;
  return next;
};

interface CacheMetadata {
  data: CalculationModel[];
  expiresAt: number;
}

type ModelListener = () => void;
const listeners: Set<ModelListener> = new Set();

const notify = () => {
  listeners.forEach(listener => listener());
};

export const modelRepository = {
  subscribe(listener: ModelListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  isExpired(expiresAt: number): boolean {
    return Date.now() > expiresAt;
  },

  async getAll(forceRefresh = false): Promise<CalculationModel[]> {
    const cached = await asyncStorageClient.get<CacheMetadata>(STORAGE_KEYS.MODELS);

    if (!cached) return [];

    if (cached.expiresAt && this.isExpired(cached.expiresAt)) {
      logger.info('[modelRepository] Cache expirado — retornando dados obsoletos e acionando refresh em background');
      if (!forceRefresh) {
        import('../application/fetchRemoteModelsUseCase')
          .then(({ fetchRemoteModelsUseCase }) => fetchRemoteModelsUseCase())
          .catch((err) => logger.error('[modelRepository] Falha no refresh de background', err));
      }
      return cached.data ?? [];
    }

    return cached.data ?? [];
  },

  async getByType(type: ModelType): Promise<CalculationModel[]> {
    const all = await this.getAll();
    return all.filter(m => m.type === type);
  },

  async getById(id: string): Promise<CalculationModel | undefined> {
    const all = await this.getAll();
    return all.find(m => m.id === id);
  },

  async getAllWithMetadata(): Promise<CacheMetadata | null> {
    return asyncStorageClient.get<CacheMetadata>(STORAGE_KEYS.MODELS);
  },

  async saveWithTTL(data: CalculationModel[]): Promise<boolean> {
    const cache: CacheMetadata = {
      data,
      expiresAt: Date.now() + MODEL_TTL_MS,
    };
    return asyncStorageClient.set(STORAGE_KEYS.MODELS, cache);
  },

  async create(model: CalculationModel): Promise<boolean> {
    return withWriteLock(async () => {
      const isSynced = await modelSyncService.syncToRemote(model);

      const modelWithStatus: CalculationModel = {
        ...model,
        syncStatus: isSynced ? 'synced' : 'pending',
        localAction: isSynced ? null : 'created',
      };

      const existing = await this.getAll();
      const updated = [modelWithStatus, ...existing];
      const success = await this.saveWithTTL(updated);

      if (success) notify();
      return success;
    });
  },

  async createFromRemote(model: CalculationModel): Promise<boolean> {
    const modelWithStatus: CalculationModel = { 
      ...model, 
      syncStatus: 'synced' as const,
      localAction: null,
    };
    
    const existing = await this.getAll();
    const updated = [modelWithStatus, ...existing];
    const success = await this.saveWithTTL(updated);
    if (success) notify();
    return success;
  },

  async update(model: CalculationModel): Promise<boolean> {
    return withWriteLock(async () => {
      const existing = await this.getAll();
      const isSynced = await modelSyncService.syncToRemote(model);

      let modelWithStatus: CalculationModel;
      if (isSynced) {
        modelWithStatus = { ...model, syncStatus: 'synced', localAction: null };
      } else {
        modelWithStatus = { ...model, syncStatus: 'pending', localAction: 'edited' };
        const pending = createPendingOperation('update', model);
        await pendingOpsService.addPendingEdit(pending);
      }

      const updated = existing.map(m => m.id === model.id ? modelWithStatus : m);
      const success = await this.saveWithTTL(updated);

      if (success) notify();
      return success;
    });
  },

  async updateLocal(model: CalculationModel): Promise<boolean> {
    return withWriteLock(async () => {
      const existing = await this.getAll();
      const updated = existing.map(m => m.id === model.id ? model : m);
      const success = await this.saveWithTTL(updated);
      if (success) notify();
      return success;
    });
  },

  // Remove model locally without triggering remote sync (for sync engine)
  async removeLocal(id: string): Promise<boolean> {
    return withWriteLock(async () => {
      const existing = await this.getAll();
      const updated = existing.filter(m => m.id !== id);
      const success = await this.saveWithTTL(updated);
      if (success) notify();
      return success;
    });
  },

  async delete(id: string): Promise<boolean> {
    return withWriteLock(async () => {
      const isSynced = await modelSyncService.deleteFromRemote(id);

      if (isSynced) {
        const existing = await this.getAll();
        const updated = existing.filter(m => m.id !== id);
        const success = await this.saveWithTTL(updated);
        if (success) notify();
        return success;
      }

      // Offline: remove locally and add to pending deletes
      const existing = await this.getAll();
      const updated = existing.filter(m => m.id !== id);
      const success = await this.saveWithTTL(updated);
      await pendingOpsService.addPendingDelete(id);
      if (success) notify();
      return true;
    });
  },
};