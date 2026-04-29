import { modelRepository } from '../infra/modelRepository';
import { CalculationModel, createModelId, ModelType } from '../domain/calculationModel';

export type CreateModelInput = {
  name: string;
  type: ModelType;
  inputs: Record<string, number>;
};

export const createModelUseCase = async (input: CreateModelInput): Promise<CalculationModel> => {
  const existing = await modelRepository.getByType(input.type);
  const duplicate = existing.find(m => m.name.toUpperCase() === input.name.toUpperCase());
  if (duplicate) {
    throw new Error('Já existe um modelo com este nome');
  }

  const now = Date.now();
  const model: CalculationModel = {
    id: createModelId(),
    name: input.name,
    type: input.type,
    inputs: input.inputs,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    localAction: 'created',
  };

  await modelRepository.create(model);
  return model;
};

export const updateModelUseCase = async (model: CalculationModel): Promise<boolean> => {
  const updated: CalculationModel = { ...model, updatedAt: Date.now(), syncStatus: 'pending', localAction: 'edited' };
  return modelRepository.update(updated);
};

export const deleteModelUseCase = async (id: string): Promise<boolean> => {
  return modelRepository.delete(id);
};

export const getModelsByTypeUseCase = async (type: ModelType): Promise<CalculationModel[]> => {
  return modelRepository.getByType(type);
};