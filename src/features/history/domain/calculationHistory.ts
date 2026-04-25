export type CalculationType = 'ipu' | 'calibration';

export interface CalculationHistory {
  id: string;
  type: CalculationType;
  inputs: Record<string, number>;
  result: number;
  createdAt: number;
}

export const createHistoryId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};