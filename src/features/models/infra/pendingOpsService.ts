import { asyncStorageClient, STORAGE_KEYS } from '@/core/storage/asyncStorageClient';
import { PendingOperation, MAX_ATTEMPTS } from '../domain/pendingOperation';

export const pendingOpsService = {
  async getPendingDeletes(): Promise<string[]> {
    return (await asyncStorageClient.get<string[]>(STORAGE_KEYS.PENDING_DELETES)) || [];
  },

  async addPendingDelete(id: string): Promise<boolean> {
    const existing = await this.getPendingDeletes();
    if (existing.includes(id)) return true;
    return asyncStorageClient.set(STORAGE_KEYS.PENDING_DELETES, [...existing, id]);
  },

  async removePendingDelete(id: string): Promise<boolean> {
    const existing = await this.getPendingDeletes();
    const updated = existing.filter(i => i !== id);
    return asyncStorageClient.set(STORAGE_KEYS.PENDING_DELETES, updated);
  },

  async getPendingEdits(): Promise<PendingOperation[]> {
    return (await asyncStorageClient.get<PendingOperation[]>(STORAGE_KEYS.PENDING_EDITS)) || [];
  },

  async addPendingEdit(operation: PendingOperation): Promise<boolean> {
    const existing = await this.getPendingEdits();
    const filtered = existing.filter(o => o.id !== operation.id);
    return asyncStorageClient.set(STORAGE_KEYS.PENDING_EDITS, [...filtered, operation]);
  },

  async updatePendingEdit(operation: PendingOperation): Promise<boolean> {
    const existing = await this.getPendingEdits();
    const updated = existing.map(o => o.id === operation.id ? operation : o);
    return asyncStorageClient.set(STORAGE_KEYS.PENDING_EDITS, updated);
  },

  async removePendingEdit(id: string): Promise<boolean> {
    const existing = await this.getPendingEdits();
    const filtered = existing.filter(o => o.id !== id);
    return asyncStorageClient.set(STORAGE_KEYS.PENDING_EDITS, filtered);
  },

  async getPendingCount(): Promise<number> {
    const deletes = await this.getPendingDeletes();
    const edits = await this.getPendingEdits();
    return deletes.length + edits.length;
  },

  async hasPending(): Promise<boolean> {
    return (await this.getPendingCount()) > 0;
  },
};