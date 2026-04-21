import React from 'react';
import { View } from 'react-native';
import { Button } from '../components/Button';
import { ScreenLayout } from '../components/ScreenLayout';

type Props = {
  onGoToCalculator: () => void;
  onGoToCalibration: () => void;
};

export const HomeScreen = ({ onGoToCalculator, onGoToCalibration }: Props) => {
  return (
    <ScreenLayout title="Calculadora IPU">
      <Button title="Calcular Injeção" onPress={onGoToCalculator} />
      <View style={{ height: 16 }} />
      <Button title="Calibrar Vazão" onPress={onGoToCalibration} />
    </ScreenLayout>
  );
};