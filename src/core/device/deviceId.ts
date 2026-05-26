import { asyncStorageClient } from '@/core/storage/asyncStorageClient';
import { STORAGE_KEYS } from '@/core/storage/storageKeys';

let cachedDeviceId: string | null = null;

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) return cachedDeviceId;

  const stored = await asyncStorageClient.get<string>(STORAGE_KEYS.DEVICE_ID);
  if (stored) {
    cachedDeviceId = stored;
    return stored;
  }

  const newId = generateId();
  await asyncStorageClient.set(STORAGE_KEYS.DEVICE_ID, newId);
  cachedDeviceId = newId;
  return newId;
};

export const resetDeviceId = async (): Promise<string> => {
  cachedDeviceId = null;
  await asyncStorageClient.remove(STORAGE_KEYS.DEVICE_ID);
  return getDeviceId();
};
