import { z } from 'zod';

export type ModelType = 'ipu' | 'calibration';

export type LocalAction = 'created' | 'edited' | null;

// Modelos são intencionalmente globais/compartilhados entre toda a equipe.
// Não possuem created_by/owner porque qualquer editor pode gerenciar qualquer modelo.
// Se no futuro for necessário isolar por usuário, adicionar coluna created_by uuid REFERENCES auth.users.
export interface CalculationModel {
  id: string;
  name: string;
  type: ModelType;
  inputs: Record<string, number>;
  createdAt: number;
  updatedAt: number;
  version: number;
  syncStatus: 'synced' | 'pending';
  localAction: LocalAction;
}

export const modelSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: 'Nome é obrigatório' }),
  type: z.enum(['ipu', 'calibration']),
  inputs: z.record(z.string(), z.number()),
  createdAt: z.number(),
  updatedAt: z.number(),
  version: z.number(),
  syncStatus: z.enum(['synced', 'pending']),
  localAction: z.enum(['created', 'edited']).nullable(),
});

export const createModelId = (): string => {
  // #09 Fix: use native crypto.randomUUID (available in RN 0.73+ / Expo 50+)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto (e.g. old Jest jsdom)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};