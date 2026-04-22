import { Button, Input, Card, theme, Toggle, HStack, VStack, Text } from '@/design-system';
import { ResultCard } from '@/components/ResultCard';
import { ScreenLayout } from '@/components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useCalibration } from '../hooks/useCalibration';
import { styles } from './CalibrationScreen.styles';

type Props = {
  goBack: () => void;
  goToCalculator: () => void;
};

export const CalibrationScreen = ({ goBack, goToCalculator }: Props) => {
  const {
    targetWeight,
    machineValue,
    actualWeight,
    extractedWeight,
    averageValue,
    isHelperActive,
    setTargetWeight,
    setMachineValue,
    setActualWeight,
    setExtractedWeight,
    setAverageValue,
    setIsHelperActive,
    result,
    error,
    fieldErrors,
    calculate,
    clear,
  } = useCalibration();

  return (
    <ScreenLayout
      title="Ajuste de Vazão"
      footer={
        <HStack>
          <Button
            title="Voltar"
            variant="secondary"
            onPress={goBack}
            icon={<Ionicons name="arrow-back" size={20} color={theme.colors.text} />}
            style={{ flex: 1 }}
          />
          <Button
            title="Calcular Injeção"
            onPress={goToCalculator}
            style={{ flex: 1 }}
          />
        </HStack>
      }
    >
      <VStack gap="lg">
        {result !== null && <ResultCard result={result} />}

        <Card style={styles.helperCard}>
          <Text weight="medium">Assistente de Peso Real</Text>
          <Toggle
            value={isHelperActive}
            onChange={setIsHelperActive}
          />
        </Card>

        {isHelperActive && (
          <Card>
            <VStack>
              <Input
                label="Peso extraído"
                value={extractedWeight}
                onChange={setExtractedWeight}
              />
              <Input
                label="Valor Média"
                value={averageValue}
                onChange={setAverageValue}
              />
            </VStack>
          </Card>
        )}

        <Card>
          <VStack>
            <Input
              label="Peso desejado"
              value={targetWeight}
              onChange={setTargetWeight}
              error={fieldErrors.targetWeight ?? undefined}
            />

            <Input
              label="Valor da máquina"
              value={machineValue}
              onChange={setMachineValue}
              error={fieldErrors.machineValue ?? undefined}
            />

            <Input
              label="Peso real"
              value={actualWeight}
              onChange={setActualWeight}
              error={fieldErrors.actualWeight ?? undefined}
            />
          </VStack>
        </Card>

        {error && <Text variant="error" style={styles.error}>{error}</Text>}

        <VStack gap="sm">
          <Button title="Calcular Ajuste" onPress={calculate} />
          <Button title="Limpar" variant="secondary" onPress={clear} />
        </VStack>
      </VStack>
    </ScreenLayout>
  );
};