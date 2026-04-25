import { asyncStorageClient, STORAGE_KEYS } from '@/core/storage/asyncStorageClient';
import { CalculationHistory } from '../domain/calculationHistory';

export const historyRepository = {
  async getAll(): Promise<CalculationHistory[]> {
    const history = await asyncStorageClient.get<CalculationHistory[]>(STORAGE_KEYS.CALCULATION_HISTORY);
    return history ?? [];
  },

  async save(history: CalculationHistory): Promise<boolean> {
    const existing = await this.getAll();
    const updated = [history, ...existing];
    return asyncStorageClient.set(STORAGE_KEYS.CALCULATION_HISTORY, updated);
  },

  async delete(id: string): Promise<boolean> {
    const existing = await this.getAll();
    const updated = existing.filter((item) => item.id !== id);
    return asyncStorageClient.set(STORAGE_KEYS.CALCULATION_HISTORY, updated);
  },

  async clear(): Promise<boolean> {
    return asyncStorageClient.remove(STORAGE_KEYS.CALCULATION_HISTORY);
  },
};