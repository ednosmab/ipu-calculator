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

const getAll = async (forceRefresh = false): Promise<CalculationModel[]> => {
  try {
    const cached = await asyncStorageClient.get<CacheMetadata>(STORAGE_KEYS.MODELS);

    if (!cached) {
      logger.info('[modelRepository] Cache miss — returning []');
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
        import('../application/fetchRemoteModelsUseCase')
          .then(({ fetchRemoteModelsUseCase }) => fetchRemoteModelsUseCase())
          .catch((err) => logger.error('[modelRepository] Falha no refresh de background', err));
      }
    }

    return data;
  } catch (e) {
    logger.error('[modelRepository] Erro crítico ao ler cache', e);
    return [];
  }
};

const saveWithTTL = async (data: CalculationModel[]): Promise<boolean> => {
  const cache: CacheMetadata = {
    data,
    expiresAt: Date.now() + CACHE_VERSION.MODEL_TTL_MS,
    schemaVersion: CACHE_VERSION.SCHEMA,
  };
  return asyncStorageClient.set(STORAGE_KEYS.MODELS, cache);
};

const getByType = async (type: ModelType): Promise<CalculationModel[]> => {
  const all = await getAll();
  return all.filter(m => m.type === type);
};

const getById = async (id: string): Promise<CalculationModel | undefined> => {
  const all = await getAll();
  return all.find(m => m.id === id);
};

const create = async (model: CalculationModel): Promise<boolean> => {
  return withWriteLock(async () => {
    const modelPending: CalculationModel = {
      ...model,
      syncStatus: 'pending',
      localAction: 'created',
    };

    const existing = await getAll();
    const updatedLocal = [modelPending, ...existing];
    const localSuccess = await saveWithTTL(updatedLocal);

    if (localSuccess) notify();

    const isSynced = await modelSyncService.syncToRemote(model);

    if (isSynced) {
      const current = await getAll();
      if (current.length > 0) {
        const updatedSynced = current.map(m => 
          m.id === model.id ? { ...m, syncStatus: 'synced' as const, localAction: null } : m
        );
        await saveWithTTL(updatedSynced);
        notify();
      }
    }

    return localSuccess;
  }, 'create');
};

const update = async (model: CalculationModel): Promise<boolean> => {
  return withWriteLock(async () => {
    const existing = await getAll();
    
    if (existing.length === 0) {
      logger.error('[modelRepository] Tentativa de edição em lista vazia - abortando');
      return false;
    }

    const modelPending: CalculationModel = { ...model, syncStatus: 'pending', localAction: 'edited' };
    const updatedLocal = existing.map(m => m.id === model.id ? modelPending : m);
    
    if (!existing.some(m => m.id === model.id)) {
      updatedLocal.push(modelPending);
    }

    const localSuccess = await saveWithTTL(updatedLocal);

    if (localSuccess) {
      await pendingOpsService.addPendingEdit(createPendingOperation('update', model));
      notify();
    }

    const isSynced = await modelSyncService.syncToRemote(model);

    if (isSynced) {
      const current = await getAll();
      if (current.length > 0) {
        const updatedSynced = current.map(m => 
          m.id === model.id ? { ...m, syncStatus: 'synced' as const, localAction: null } : m
        );
        await saveWithTTL(updatedSynced);
        notify();
      }
    }

    return localSuccess;
  }, 'update');
};

const updateLocal = async (model: CalculationModel): Promise<boolean> => {
  return withWriteLock(async () => {
    const existing = await getAll();
    const updated = existing.map(m => m.id === model.id ? model : m);
    const success = await saveWithTTL(updated);
    if (success) notify();
    return success;
  }, 'updateLocal');
};

const removeLocal = async (id: string): Promise<boolean> => {
  return withWriteLock(async () => {
    const existing = await getAll();
    const updated = existing.filter(m => m.id !== id);
    const success = await saveWithTTL(updated);
    if (success) notify();
    return success;
  }, 'removeLocal');
};

const deleteModel = async (id: string): Promise<boolean> => {
  return withWriteLock(async () => {
    const existing = await getAll();
    const updated = existing.filter(m => m.id !== id);
    const localSuccess = await saveWithTTL(updated);

    if (localSuccess) notify();

    const isSynced = await modelSyncService.deleteFromRemote(id);

    if (!isSynced) {
      await pendingOpsService.addPendingDelete(id);
    }

    return localSuccess;
  }, 'delete');
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
  getByType,
  getById,
  getAllWithMetadata: () => asyncStorageClient.get<CacheMetadata>(STORAGE_KEYS.MODELS),
  saveWithTTL,
  create,
  createFromRemote: async (model: CalculationModel) => {
    const modelWithStatus: CalculationModel = { ...model, syncStatus: 'synced', localAction: null };
    const existing = await getAll();
    const updated = [modelWithStatus, ...existing];
    const success = await saveWithTTL(updated);
    if (success) notify();
    return success;
  },
  update,
  updateLocal,
  removeLocal,
  delete: deleteModel,
};