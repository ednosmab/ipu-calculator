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

  it('should render all basic input fields', () => {
    const { getByLabelText, getByText } = render(
      <TranslationProvider>
        <CalibrationScreen goBack={mockGoBack} goToCalculator={mockGoToCalculator} />
      </TranslationProvider>
    );

    expect(getByLabelText('Peso Alvo')).toBeTruthy();
    expect(getByLabelText('Valor da Máquina')).toBeTruthy();
    expect(getByLabelText('Peso Real')).toBeTruthy();
    expect(getByText('Calcular Ajuste')).toBeTruthy();
  });

  it('should calculate the adjustment result correctly', async () => {
    const { getByLabelText, getByText, findByText } = render(
      <TranslationProvider>
        <CalibrationScreen goBack={mockGoBack} goToCalculator={mockGoToCalculator} />
      </TranslationProvider>
    );

    fireEvent.changeText(getByLabelText('Peso Alvo'), '1000');
    fireEvent.changeText(getByLabelText('Valor da Máquina'), '100');
    fireEvent.changeText(getByLabelText('Peso Real'), '900');
    fireEvent.press(getByText('Calcular Ajuste'));

    // Cálculo simplificado para teste: (1000 / 900) * 100 = 111.11
    expect(await findByText('111,11')).toBeTruthy();
  });

  it('should show helper fields when toggle is active', () => {
    const { getByText, queryByLabelText, getByLabelText } = render(
      <TranslationProvider>
        <CalibrationScreen goBack={mockGoBack} goToCalculator={mockGoToCalculator} />
      </TranslationProvider>
    );

    // Inicialmente não deve mostrar
    expect(queryByLabelText('Peso Extraído')).toBeNull();

    // Ativar o assistente (Toggle)
    const toggle = getByText('Assistente de Gramatura');
    fireEvent.press(toggle);

    expect(getByLabelText('Peso Extraído')).toBeTruthy();
    expect(getByLabelText('Média Extraída')).toBeTruthy();
  });
});
