import React from 'react';
import { Button, VStack } from '@/design-system';
import { ScreenLayout } from '@/components/ScreenLayout';

type Props = {
  onGoToCalculator: () => void;
  onGoToCalibration: () => void;
};

export const HomeScreen = ({ onGoToCalculator, onGoToCalibration }: Props) => {
  return (
    <ScreenLayout title="Calculadora IPU" centered>
      <VStack gap="md">
        <Button title="Calcular Injeção" onPress={onGoToCalculator} />
        <Button title="Calibrar Vazão" variant="secondary" onPress={onGoToCalibration} />
      </VStack>
    </ScreenLayout>
  );
};