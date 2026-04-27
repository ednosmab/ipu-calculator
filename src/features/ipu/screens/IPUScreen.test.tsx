import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { IPUScreen } from './IPUScreen';
import { TranslationProvider } from '@/i18n/TranslationContext';
import * as modelUseCases from '@/features/models/application/modelUseCases';

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

  it('should render all input fields and calculate button', () => {
    const { getByLabelText } = render(
      <TranslationProvider>
        <IPUScreen goBack={mockGoBack} goToCalibration={mockGoToCalibration} />
      </TranslationProvider>
    );

    expect(getByLabelText('Isocianato')).toBeTruthy();
    expect(getByLabelText('Poliol')).toBeTruthy();
    expect(getByLabelText('Calcular Injeção')).toBeTruthy();
  });

  it('should calculate the result when values are entered', async () => {
    const { getByLabelText, findByText } = render(
      <TranslationProvider>
        <IPUScreen goBack={mockGoBack} goToCalibration={mockGoToCalibration} />
      </TranslationProvider>
    );

    const isoInput = getByLabelText('Isocianato');
    const polyolInput = getByLabelText('Poliol');
    
    // Usa getByLabelText pois o botão tem accessibilityLabel
    const calcButton = getByLabelText('Calcular Injeção');

    fireEvent.changeText(isoInput, '100');
    fireEvent.changeText(polyolInput, '150');
    fireEvent.press(calcButton);

    // 100 / 150 * 100 = 66,67 (no locale pt-BR)
    expect(await findByText('66,67')).toBeTruthy();
  });

  it('should show validation errors when fields are empty', async () => {
    const { getByText, getByLabelText } = render(
      <TranslationProvider>
        <IPUScreen goBack={mockGoBack} goToCalibration={mockGoToCalibration} />
      </TranslationProvider>
    );

    const calcButton = getByLabelText('Calcular Injeção');
    fireEvent.press(calcButton);

    await waitFor(() => {
      expect(getByText('Campo obrigatório')).toBeTruthy();
    });
  });

  it('should open save modal and call createModelUseCase on success', async () => {
    (modelUseCases.createModelUseCase as jest.Mock).mockResolvedValue(true);
    (modelUseCases.getModelsByTypeUseCase as jest.Mock).mockResolvedValue([]);

    const { getByLabelText, findByText, queryByText } = render(
      <TranslationProvider>
        <IPUScreen goBack={mockGoBack} goToCalibration={mockGoToCalibration} />
      </TranslationProvider>
    );

    fireEvent.changeText(getByLabelText('Isocianato'), '100');
    fireEvent.changeText(getByLabelText('Poliol'), '150');
    fireEvent.press(getByLabelText('Calcular Injeção'));

    // Espera o botão salvar como modelo aparecer
    const saveAsModelButton = await waitFor(() => getByLabelText('Salvar como Modelo'));
    fireEvent.press(saveAsModelButton);

    const nameInput = getByLabelText('Nome do Modelo');
    fireEvent.changeText(nameInput, 'MODELO TESTE');

    const saveButton = getByLabelText('Salvar');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(modelUseCases.createModelUseCase).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'MODELO TESTE',
          type: 'ipu',
          inputs: { injectionTime: 66.67 },
        })
      );
    });

    await waitFor(() => {
      expect(queryByText('Nome do Modelo')).toBeNull();
    });
  });
});
