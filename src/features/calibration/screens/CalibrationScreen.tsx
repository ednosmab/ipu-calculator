import { Button, Input, Card, theme, Toggle, HStack, VStack, Text } from '@/design-system';
import { ResultCard } from '@/components/ResultCard';
import { ScreenLayout, ScreenLayoutRef } from '@/components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { useCalibration } from '../hooks/useCalibration';
import { useTranslation } from '@/i18n/TranslationContext';
import { styles } from './CalibrationScreen.styles';

type Props = {
  goBack: () => void;
  goToCalculator: () => void;
};

export const CalibrationScreen = ({ goBack, goToCalculator }: Props) => {
  const screenRef = useRef<ScreenLayoutRef>(null);
  const { t } = useTranslation();
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

  const handleCalculate = () => {
    calculate();
    setTimeout(() => screenRef.current?.scrollToTop(), 150);
  };

  return (
    <ScreenLayout
      ref={screenRef}
      title={t('calibrateFlow')}
      footer={
        <HStack>
          <Button
            title={t('back')}
            variant="secondary"
            onPress={goBack}
            icon={<Ionicons name="arrow-back" size={20} color={theme.colors.text} />}
            style={{ flex: 1 }}
          />
          <Button
            title={t('goToCalculator')}
            onPress={goToCalculator}
            style={{ flex: 1 }}
          />
        </HStack>
      }
    >
      <VStack gap="lg">
        {result !== null && <ResultCard result={result} />}

        <Card style={styles.helperCard}>
          <Text weight="medium">{t('weightHelper')}</Text>
          <Toggle
            value={isHelperActive}
            onChange={setIsHelperActive}
          />
        </Card>

        {isHelperActive && (
          <Card>
            <VStack>
              <Input
                label={t('extractedWeight')}
                value={extractedWeight}
                onChange={setExtractedWeight}
              />
              <Input
                label={t('averageValue')}
                value={averageValue}
                onChange={setAverageValue}
              />
            </VStack>
          </Card>
        )}

        <Card>
          <VStack>
            <Input
              label={t('targetWeight')}
              value={targetWeight}
              onChange={setTargetWeight}
              error={fieldErrors.targetWeight ?? undefined}
            />

            <Input
              label={t('machineValue')}
              value={machineValue}
              onChange={setMachineValue}
              error={fieldErrors.machineValue ?? undefined}
            />

            <Input
              label={t('actualWeight')}
              value={actualWeight}
              onChange={setActualWeight}
              error={fieldErrors.actualWeight ?? undefined}
            />
          </VStack>
        </Card>

        {error && <Text variant="error" style={styles.error}>{error}</Text>}

        <VStack gap="sm">
          <Button title={t('calculateAdjustment')} onPress={handleCalculate} />
          <Button title={t('clear')} variant="secondary" onPress={clear} />
        </VStack>
      </VStack>
    </ScreenLayout>
  );
};