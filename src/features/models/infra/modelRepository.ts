import { asyncStorageClient, STORAGE_KEYS } from '@/core/storage/asyncStorageClient';
import { CACHE_VERSION } from '@/core/versioning/cacheVersion';
import { CalculationModel, ModelType } from '../domain/calculationModel';
import { createPendingOperation } from '../domain/pendingOperation';
import { modelSyncService } from './modelSyncService';
import { pendingOpsService } from './pendingOpsService';
import { logger } from '@/core/logging/logger';

// Simple async mutex to prevent race conditions on concurrent write operations
let writeQueue: Promise<unknown> = Promise.resolve();
const withWriteLock = <T>(fn: () => Promise<T>, opName: string): Promise<T> => {
  logger.info(`[Lock] Entrando na fila: ${opName}`);
  const next = writeQueue.then(async () => {
    try {
      return await fn();
    } finally {
      logger.info(`[Lock] Saindo da fila: ${opName}`);
    }
  }).catch((err) => {
    logger.error(`[Lock] Erro na fila ${opName}:`, err);
    writeQueue = Promise.resolve(); 
    throw err;
  });
  writeQueue = next;
  return next;
};

interface CacheMetadata {
  data: CalculationModel[];
  expiresAt: number;
  schemaVersion?: string;
}

type ModelListener = () => void;
const listeners: Set<ModelListener> = new Set();

const notify = () => {
  logger.info('[modelRepository] Notifying listeners of change');
  setTimeout(() => {
    listeners.forEach(listener => listener());
  }, 0);
};

const isExpired = (expiresAt: number): boolean => {
  return Date.now() > expiresAt;
};

const recoveryAndRefresh = async (): Promise<CalculationModel[]> => {
  try {
    const { schemaMigrationService } = await import('../application/schemaMigrationService');
    const restored = await schemaMigrationService.restoreBackup();
    if (restored) {
      logger.info('[modelRepository] Backup restaurado com sucesso');
      return getAll(true);
    }
  } catch (backupErr) {
    logger.error('[modelRepository] Falha ao restaurar backup', backupErr);
  }

  logger.warn('[modelRepository] Backup falhou — limpando cache e forçando refresh remoto');
  await asyncStorageClient.remove(STORAGE_KEYS.MODELS);
  try {
    const { fetchRemoteModelsUseCase } = await import('../application/fetchRemoteModelsUseCase');
    fetchRemoteModelsUseCase();
  } catch (fetchErr) {
    logger.error('[modelRepository] Falha ao acionar refresh remoto após recovery', fetchErr);
  }
  return [];
};

const getAll = async (forceRefresh = false): Promise<CalculationModel[]> => {
  try {
    const cached = await asyncStorageClient.get<CacheMetadata>(STORAGE_KEYS.MODELS);

    if (!cached) {
      const hasSchemaVersion = await asyncStorageClient.get<string>(STORAGE_KEYS.CACHE_VERSION);
      if (hasSchemaVersion) {
        logger.warn('[modelRepository] Cache corrompido (schema existe mas models não) — tentando backup');
        return recoveryAndRefresh();
      }
      logger.info('[modelRepository] Cache vazio — returning []');
      return [];
    }

    if (cached.schemaVersion && cached.schemaVersion !== CACHE_VERSION.SCHEMA) {
      logger.warn(`[modelRepository] Schema desatualizado — invalidando cache (${cached.schemaVersion} → ${CACHE_VERSION.SCHEMA})`);
      await asyncStorageClient.remove(STORAGE_KEYS.MODELS);
      return [];
    }

    const data = cached.data || [];

    if (cached.expiresAt && isExpired(cached.expiresAt)) {
      logger.info('[modelRepository] Cache expirado — acionando refresh em background');
      if (!forceRefresh) {
        // Run refresh in background without awaiting
        import('../application/fetchRemoteModelsUseCase')
          .then(({ fetchRemoteModelsUseCase }) => fetchRemoteModelsUseCase())
          .catch((err) => logger.error('[modelRepository] Falha no refresh de background', err));
      }
    }

    return data;
  } catch (e) {
    logger.error('[modelRepository] Erro crítico ao ler cache', e);
    return recoveryAndRefresh();
  }
};

/**
 * INTERNAL USE ONLY: Save to storage with TTL and schema version.
 * This should always be called within a write lock to prevent race conditions.
 */
const _saveToStorage = async (data: CalculationModel[]): Promise<boolean> => {
  const cache: CacheMetadata = {
    data,
    expiresAt: Date.now() + CACHE_VERSION.MODEL_TTL_MS,
    schemaVersion: CACHE_VERSION.SCHEMA,
  };
  return asyncStorageClient.set(STORAGE_KEYS.MODELS, cache);
};

/**
 * INTERNAL USE ONLY: Handles background sync and status update.
 */
const _handleBackgroundSync = (model: CalculationModel) => {
  modelSyncService.syncToRemote(model).then(async (isSynced) => {
    if (isSynced) {
      await withWriteLock(async () => {
        const current = await getAll();
        const updatedSynced = current.map(m => 
          m.id === model.id ? { ...m, syncStatus: 'synced' as const, localAction: null } : m
        );
        await _saveToStorage(updatedSynced);
        notify();
      }, 'sync-status-update');
    }
  }).catch(err => logger.error('[modelRepository] Background sync error:', err));
};

const create = async (model: CalculationModel): Promise<boolean> => {
  const modelToSave: CalculationModel = { 
    ...model, 
    syncStatus: 'pending', 
    localAction: 'created' 
  };
  
  const localSuccess = await withWriteLock(async () => {
    const existing = await getAll();
    const updatedLocal = [modelToSave, ...existing];
    const success = await _saveToStorage(updatedLocal);

    if (success) notify();
    return success;
  }, 'create-local');

  if (localSuccess) {
    _handleBackgroundSync(modelToSave);
  }

  return localSuccess;
};

const update = async (model: CalculationModel): Promise<boolean> => {
  const modelToSave: CalculationModel = { 
    ...model, 
    syncStatus: 'pending', 
    localAction: 'edited' 
  };

  const localSuccess = await withWriteLock(async () => {
    const existing = await getAll();
    
    // Update or Add
    const exists = existing.some(m => m.id === modelToSave.id);
    let updatedLocal: CalculationModel[];
    
    if (exists) {
      updatedLocal = existing.map(m => m.id === modelToSave.id ? modelToSave : m);
    } else {
      updatedLocal = [modelToSave, ...existing];
    }

    const success = await _saveToStorage(updatedLocal);

    if (success) {
      await pendingOpsService.addPendingEdit(createPendingOperation('update', modelToSave));
      notify();
    }
    return success;
  }, 'update-local');

  if (localSuccess) {
    _handleBackgroundSync(modelToSave);
  }

  return localSuccess;
};

const updateLocal = async (model: CalculationModel): Promise<boolean> => {
  return withWriteLock(async () => {
    const existing = await getAll();
    const updated = existing.map(m => m.id === model.id ? model : m);
    const success = await _saveToStorage(updated);
    if (success) notify();
    return success;
  }, 'updateLocal');
};

const removeLocal = async (id: string): Promise<boolean> => {
  return withWriteLock(async () => {
    const existing = await getAll();
    const updated = existing.filter(m => m.id !== id);
    const success = await _saveToStorage(updated);
    if (success) notify();
    return success;
  }, 'removeLocal');
};

const deleteModel = async (id: string): Promise<boolean> => {
  const localSuccess = await withWriteLock(async () => {
    const existing = await getAll();
    const updated = existing.filter(m => m.id !== id);
    const success = await _saveToStorage(updated);

    if (success) notify();
    return success;
  }, 'delete-local');

  if (localSuccess) {
    modelSyncService.deleteFromRemote(id).then(async (isSynced) => {
      if (!isSynced) {
        await pendingOpsService.addPendingDelete(id);
      }
    }).catch(err => logger.error('[modelRepository] Error in background delete sync', err));
  }

  return localSuccess;
};

export const modelRepository = {
  subscribe: (listener: ModelListener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  isExpired,
  getAll,
  getByType: async (type: ModelType) => {
    const all = await getAll();
    return all.filter(m => m.type === type);
  },
  getById: async (id: string) => {
    const all = await getAll();
    return all.find(m => m.id === id);
  },
  getAllWithMetadata: () => asyncStorageClient.get<CacheMetadata>(STORAGE_KEYS.MODELS),
  saveWithLock: async (data: CalculationModel[]) => {
    return withWriteLock(async () => {
      const success = await _saveToStorage(data);
      if (success) notify();
      return success;
    }, 'manual-save');
  },
  create,
  createFromRemote: async (model: CalculationModel) => {
    return withWriteLock(async () => {
      const modelWithStatus: CalculationModel = { ...model, syncStatus: 'synced', localAction: null };
      const existing = await getAll();
      const updated = [modelWithStatus, ...existing];
      const success = await _saveToStorage(updated);
      if (success) notify();
      return success;
    }, 'createFromRemote');
  },
  update,
  updateLocal,
  removeLocal,
  delete: deleteModel,
};