import { modelRepository } from '../infra/modelRepository';
import { CalculationModel, createModelId, ModelType } from '../domain/calculationModel';

export type CreateModelInput = {
  name: string;
  type: ModelType;
  inputs: Record<string, number>;
};

export const createModelUseCase = async (input: CreateModelInput): Promise<CalculationModel> => {
  const now = Date.now();
  const model: CalculationModel = {
    id: createModelId(),
    name: input.name,
    type: input.type,
    inputs: input.inputs,
    createdAt: now,
    updatedAt: now,
  };

  await modelRepository.create(model);
  return model;
};

export const updateModelUseCase = async (model: CalculationModel): Promise<boolean> => {
  const updated = { ...model, updatedAt: Date.now() };
  return modelRepository.update(updated);
};

export const deleteModelUseCase = async (id: string): Promise<boolean> => {
  return modelRepository.delete(id);
};

export const getModelsByTypeUseCase = async (type: ModelType): Promise<CalculationModel[]> => {
  return modelRepository.getByType(type);
};