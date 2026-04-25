import { asyncStorageClient, STORAGE_KEYS } from '@/core/storage/asyncStorageClient';
import { CalculationModel, ModelType } from '../domain/calculationModel';

export const modelRepository = {
  async getAll(): Promise<CalculationModel[]> {
    const models = await asyncStorageClient.get<CalculationModel[]>(STORAGE_KEYS.MODELS);
    return models ?? [];
  },

  async getByType(type: ModelType): Promise<CalculationModel[]> {
    const all = await this.getAll();
    return all.filter(m => m.type === type);
  },

  async getById(id: string): Promise<CalculationModel | undefined> {
    const all = await this.getAll();
    return all.find(m => m.id === id);
  },

  async create(model: CalculationModel): Promise<boolean> {
    const existing = await this.getAll();
    const updated = [model, ...existing];
    return asyncStorageClient.set(STORAGE_KEYS.MODELS, updated);
  },

  async update(model: CalculationModel): Promise<boolean> {
    const existing = await this.getAll();
    const updated = existing.map(m => m.id === model.id ? model : m);
    return asyncStorageClient.set(STORAGE_KEYS.MODELS, updated);
  },

  async delete(id: string): Promise<boolean> {
    const existing = await this.getAll();
    const updated = existing.filter(m => m.id !== id);
    return asyncStorageClient.set(STORAGE_KEYS.MODELS, updated);
  },
};