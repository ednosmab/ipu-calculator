import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CalibrationScreen } from './CalibrationScreen';
import { TranslationProvider } from '@/i18n/TranslationContext';

// Mock do ScreenLayout para evitar efeitos colaterais de rede e Expo no ambiente de testes
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

// Mock das traduções
jest.mock('@/i18n/TranslationContext', () => ({
  ...jest.requireActual('@/i18n/TranslationContext'),
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        calibrateFlow: 'Calibrar Vazão',
        targetWeight: 'Peso Alvo',
        machineValue: 'Valor da Máquina',
        actualWeight: 'Peso Real',
        calculateAdjustment: 'Calcular Ajuste',
        weightHelper: 'Assistente de Gramatura',
        extractedWeight: 'Peso Extraído',
        averageValue: 'Média Extraída',
        requiredField: 'Campo obrigatório',
        back: 'back',
        goToCalculator: 'goToCalculator',
        clear: 'clear'
      };
      return translations[key] || key;
    },
  }),
}));

describe('CalibrationScreen Integration Tests', () => {
  const mockGoBack = jest.fn();
  const mockGoToCalculator = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all basic input fields', async () => {
    const { getByLabelText, getByText } = render(
      <TranslationProvider>
        <CalibrationScreen goBack={mockGoBack} goToCalculator={mockGoToCalculator} />
      </TranslationProvider>
    );

    await waitFor(() => {
      expect(getByLabelText('Peso Alvo')).toBeTruthy();
      expect(getByLabelText('Valor da Máquina')).toBeTruthy();
      expect(getByLabelText('Peso Real')).toBeTruthy();
      expect(getByText('Calcular Ajuste')).toBeTruthy();
    });
  });

  it('should calculate the adjustment result correctly', async () => {
    const { getByLabelText, getByText, findByText } = render(
      <TranslationProvider>
        <CalibrationScreen goBack={mockGoBack} goToCalculator={mockGoToCalculator} />
      </TranslationProvider>
    );

    // Aguarda estabilização do histórico
    await waitFor(() => expect(getByLabelText('Peso Alvo')).toBeTruthy());

    fireEvent.changeText(getByLabelText('Peso Alvo'), '1000');
    fireEvent.changeText(getByLabelText('Valor da Máquina'), '100');
    fireEvent.changeText(getByLabelText('Peso Real'), '900');
    fireEvent.press(getByText('Calcular Ajuste'));

    expect(await findByText(/111,11/)).toBeTruthy();
  });

  it('should show helper fields when toggle is active', async () => {
    const { getByRole, queryByLabelText, getByLabelText, getByText } = render(
      <TranslationProvider>
        <CalibrationScreen goBack={mockGoBack} goToCalculator={mockGoToCalculator} />
      </TranslationProvider>
    );

    // Aguarda estabilização do histórico
    await waitFor(() => expect(getByText('Assistente de Gramatura')).toBeTruthy());

    expect(queryByLabelText('Peso Extraído')).toBeNull();

    const toggle = getByRole('switch');
    fireEvent(toggle, 'valueChange', true);

    expect(getByLabelText('Peso Extraído')).toBeTruthy();
    expect(getByLabelText('Média Extraída')).toBeTruthy();
  });
});
