import { z } from 'zod';

export type ModelType = 'ipu' | 'calibration';

export interface CalculationModel {
  id: string;
  name: string;
  type: ModelType;
  inputs: Record<string, number>;
  createdAt: number;
  updatedAt: number;
  syncStatus: 'synced' | 'pending';
}

export const modelSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: 'Nome é obrigatório' }),
  type: z.enum(['ipu', 'calibration']),
  inputs: z.record(z.string(), z.number()),
  createdAt: z.number(),
  updatedAt: z.number(),
  syncStatus: z.enum(['synced', 'pending']),
});

export const createModelId = (): string => {
  // Gera um UUID v4 simples compatível com ambientes JS
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};