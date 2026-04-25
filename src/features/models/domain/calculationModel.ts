import { z } from 'zod';

export type ModelType = 'ipu' | 'calibration';

export interface CalculationModel {
  id: string;
  name: string;
  type: ModelType;
  inputs: Record<string, number>;
  createdAt: number;
  updatedAt: number;
}

export const modelSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: 'Nome é obrigatório' }),
  type: z.enum(['ipu', 'calibration']),
  inputs: z.record(z.number()),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const createModelId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};