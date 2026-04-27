import * as modelUseCases from '@/features/models/application/modelUseCases';
import { TranslationProvider } from '@/i18n/TranslationContext';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { IPUScreen } from './IPUScreen';

// Mock do ScreenLayout para evitar efeitos colaterais de rede nos testes
jest.mock('@/components/ScreenLayout', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    ScreenLayout: React.forwardRef(({ children, title, footer }, ref) => {
      return (
        <View>
          <Text>{title}</Text>
          {children}
          {footer}
        </View>
      );
    }),
  };
});

// Mock do Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Stack: { Screen: () => null },
}));

// Mock do Expo Haptics
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
}));

// Mocks específicos deste teste que não estão no setup global
jest.mock('@/features/models/application/modelUseCases', () => ({
  createModelUseCase: jest.fn(),
  getModelsByTypeUseCase: jest.fn(() => Promise.resolve([])),
  updateModelUseCase: jest.fn(),
}));

describe('IPUScreen Integration Tests', () => {
  const mockGoBack = jest.fn();
  const mockGoToCalibration = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all input fields and calculate button', async () => {
    const { getByLabelText } = render(
      <TranslationProvider>
        <IPUScreen goBack={mockGoBack} goToCalibration={mockGoToCalibration} />
      </TranslationProvider>
    );

    await waitFor(() => {
      expect(getByLabelText('Isocianato')).toBeTruthy();
      expect(getByLabelText('Poliol')).toBeTruthy();
      expect(getByLabelText('Calcular Injeção')).toBeTruthy();
    });
  });

  it('should calculate the result when values are entered', async () => {
    const { getByLabelText, findByText } = render(
      <TranslationProvider>
        <IPUScreen goBack={mockGoBack} goToCalibration={mockGoToCalibration} />
      </TranslationProvider>
    );

    await waitFor(() => expect(getByLabelText('Isocianato')).toBeTruthy());

    const isoInput = getByLabelText('Isocianato');
    const polyolInput = getByLabelText('Poliol');
    const calcButton = getByLabelText('Calcular Injeção');

    fireEvent.changeText(isoInput, '100');
    fireEvent.changeText(polyolInput, '150');
    fireEvent.press(calcButton);

    expect(await findByText(/1\.785,71/)).toBeTruthy();
  });

  it('should show validation errors when fields are empty', async () => {
    const { getAllByText, getByLabelText } = render(
      <TranslationProvider>
        <IPUScreen goBack={mockGoBack} goToCalibration={mockGoToCalibration} />
      </TranslationProvider>
    );

    await waitFor(() => expect(getByLabelText('Calcular Injeção')).toBeTruthy());

    const calcButton = getByLabelText('Calcular Injeção');
    fireEvent.press(calcButton);

    await waitFor(() => {
      expect(getAllByText('Isocianato deve ser maior que zero').length).toBeGreaterThan(0);
      expect(getAllByText('Poliol deve ser maior que zero').length).toBeGreaterThan(0);
    });
  });

  it('should open save modal and call createModelUseCase on success', async () => {
    (modelUseCases.createModelUseCase as jest.Mock).mockResolvedValue(true);
    (modelUseCases.getModelsByTypeUseCase as jest.Mock).mockResolvedValue([]);

    const { getByLabelText, findByText, queryByText, findByLabelText } = render(
      <TranslationProvider>
        <IPUScreen goBack={mockGoBack} goToCalibration={mockGoToCalibration} />
      </TranslationProvider>
    );

    await waitFor(() => expect(getByLabelText('Isocianato')).toBeTruthy());

    fireEvent.changeText(getByLabelText('Isocianato'), '10');
    fireEvent.changeText(getByLabelText('Poliol'), '15');
    fireEvent.press(getByLabelText('Calcular Injeção'));

    const saveAsModelButton = await waitFor(() => getByLabelText('Salvar como Modelo'));
    fireEvent.press(saveAsModelButton);

    const nameInput = await findByLabelText('Nome do Modelo');
    fireEvent.changeText(nameInput, 'MODELO TESTE');

    const saveButton = getByLabelText('Salvar');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(modelUseCases.createModelUseCase).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'MODELO TESTE',
          type: 'ipu',
          inputs: { injectionTime: expect.any(Number) },
        })
      );
    });

    await waitFor(() => {
      expect(queryByText('Nome do Modelo')).toBeNull();
    });
  });
});
