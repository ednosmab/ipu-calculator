import { historyRepository } from '../infra/historyRepository';
import { CalculationHistory, createHistoryId, CalculationType } from '../domain/calculationHistory';

export type SaveCalculationInput = {
  type: CalculationType;
  inputs: Record<string, number>;
  result: number;
};

export const saveCalculationUseCase = async (input: SaveCalculationInput): Promise<boolean> => {
  const history: CalculationHistory = {
    id: createHistoryId(),
    type: input.type,
    inputs: input.inputs,
    result: input.result,
    createdAt: Date.now(),
  };

  return historyRepository.save(history);
};