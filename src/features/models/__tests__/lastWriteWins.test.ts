import { fetchRemoteModelsUseCase } from '../application/fetchRemoteModelsUseCase';
import { modelRepository } from '../infra/modelRepository';
import { modelSyncService } from '../infra/modelSyncService';
import { CalculationModel } from '../domain/calculationModel';

jest.mock('../infra/modelRepository', () => ({
  modelRepository: {
    getAll: jest.fn(),
    saveWithLock: jest.fn(),
  },
}));

jest.mock('../infra/modelSyncService', () => ({
  modelSyncService: {
    syncToRemote: jest.fn(),
    deleteFromRemote: jest.fn(),
  },
}));

jest.mock('@/core/infra/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'model-1',
            name: 'Modelo do Supabase',
            type: 'ipu',
            inputs: { isocyanate: 0.200, polyol: 0.300 },
            created_at: '2026-05-01T10:00:00Z',
            updated_at: '2026-05-01T12:00:00Z', // mais recente
          },
        ],
        error: null,
      }),
    }),
  },
}));

jest.mock('@/core/api/edgeFunctionsClient', () => ({
  edgeFunctionsClient: {
    getModels: jest.fn().mockResolvedValue([
      {
        id: 'model-1',
        name: 'Modelo do Supabase',
        type: 'ipu',
        inputs: { isocyanate: 0.200, polyol: 0.300 },
        created_at: '2026-05-01T10:00:00Z',
        updated_at: '2026-05-01T12:00:00Z', // mais recente
      },
    ]),
  },
}));

describe('Last Write Wins', () => {
  const oldTimestamp = new Date('2026-05-01T08:00:00').getTime();
  const newTimestamp = new Date('2026-05-01T12:00:00').getTime();

  const localModel: CalculationModel = {
    id: 'model-1',
    name: 'Modelo Local Antigo',
    type: 'ipu',
    inputs: { isocyanate: 0.100, polyol: 0.150 },
    createdAt: oldTimestamp,
    updatedAt: oldTimestamp,
    syncStatus: 'synced',
    localAction: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should prefer remote when remote updatedAt > local updatedAt', async () => {
    (modelRepository.getAll as jest.Mock).mockResolvedValue([localModel]);

    await fetchRemoteModelsUseCase();

    expect(modelRepository.saveWithLock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Modelo do Supabase', // remote wins
          inputs: { isocyanate: 0.200, polyol: 0.300 },
        }),
      ])
    );
  });

  it('should keep local when local updatedAt > remote updatedAt', async () => {
    const newerLocal: CalculationModel = {
      ...localModel,
      updatedAt: newTimestamp,
    };

    (modelRepository.getAll as jest.Mock).mockResolvedValue([newerLocal]);

    await fetchRemoteModelsUseCase();

    expect(modelRepository.saveWithLock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Modelo Local Antigo', // local wins
          inputs: { isocyanate: 0.100, polyol: 0.150 },
        }),
      ])
    );
  });
});