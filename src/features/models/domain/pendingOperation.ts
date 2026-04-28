import { CalculationModel } from './calculationModel';

export type PendingOperationType = 'create' | 'update' | 'delete';

export interface PendingOperation {
  id: string;
  type: PendingOperationType;
  model?: CalculationModel;
  attempts: number;
  lastAttempt: number;
  error?: string;
}

export const MAX_ATTEMPTS = 3;

export const createPendingOperation = (
  type: PendingOperationType,
  model: CalculationModel
): PendingOperation => ({
  id: model.id,
  type,
  model,
  attempts: 0,
  lastAttempt: Date.now(),
});

export const createPendingDelete = (id: string): PendingOperation => ({
  id,
  type: 'delete',
  attempts: 0,
  lastAttempt: Date.now(),
});