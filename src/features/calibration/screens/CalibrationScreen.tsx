import { logService } from '@/core/logging/LogService';
import { InputRef } from '@/design-system/components/Input';
import { Button, Input, Card, theme, Toggle, HStack, VStack, Text } from '@/design-system';
import { ResultCard } from '@/components/ResultCard';
import { HistoryList } from '@/components/HistoryList';
import { ScreenLayout, ScreenLayoutRef } from '@/components/ScreenLayout';
import { FontAwesome5 } from '@expo/vector-icons';
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
  const extractedWeightRef = useRef<InputRef>({ focus: () => {}, current: null });
  const averageValueRef = useRef<InputRef>({ focus: () => {}, current: null });
  const targetWeightRef = useRef<InputRef>({ focus: () => {}, current: null });
  const machineValueRef = useRef<InputRef>({ focus: () => {}, current: null });
  const actualWeightRef = useRef<InputRef>({ focus: () => {}, current: null });
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
    history,
    clearHistory,
    fillFromHistory,
  } = useCalibration();

  const handleCalculate = () => {
    logService.info('Calibration calculation started', { targetWeight, machineValue, actualWeight });
    
    const calcResult = calculate();
    
    if (calcResult.hasErrors) {
      logService.warn('Validation failed', { fieldErrors: calcResult.fieldErrors });
      
      // Prioritize focus based on what's visible and wrong
      if (isHelperActive) {
        if (calcResult.fieldErrors.extractedWeight) {
          extractedWeightRef.current?.focus();
          return;
        }
        if (calcResult.fieldErrors.averageValue) {
          averageValueRef.current?.focus();
          return;
        }
      }

      if (calcResult.fieldErrors.targetWeight) {
        targetWeightRef.current?.focus();
      } else if (calcResult.fieldErrors.machineValue) {
        machineValueRef.current?.focus();
      } else if (calcResult.fieldErrors.actualWeight) {
        actualWeightRef.current?.focus();
      }
    } else {
      setTimeout(() => screenRef.current?.scrollToTop(), 150);
    }
  };

  return (
    <ScreenLayout
      ref={screenRef}
      title={t('calibrateFlow')}
      footer={
        <HStack gap="sm">
          <Button
            title={t('back')}
            variant="secondary"
            onPress={goBack}
            icon={<FontAwesome5 name="arrow-left" size={20} color={theme.colors.text} />}
          />
          <Button
            title={t('goToCalculator')}
            onPress={goToCalculator}
            icon={<FontAwesome5 name="calculator" size={20} color={theme.colors.bg} />}
          />
        </HStack>
      }
    >
      <VStack gap="lg">
        <ResultCard result={result} />

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
                ref={extractedWeightRef}
                label={t('extractedWeight')}
                value={extractedWeight}
                onChange={setExtractedWeight}
                error={fieldErrors.extractedWeight ?? undefined}
              />
              <Input
                ref={averageValueRef}
                label={t('averageValue')}
                value={averageValue}
                onChange={setAverageValue}
                error={fieldErrors.averageValue ?? undefined}
              />
            </VStack>
          </Card>
        )}

        <Card>
          <VStack>
            <Input
              ref={targetWeightRef}
              label={t('targetWeight')}
              value={targetWeight}
              onChange={setTargetWeight}
              error={fieldErrors.targetWeight ?? undefined}
            />

            <Input
              ref={machineValueRef}
              label={t('machineValue')}
              value={machineValue}
              onChange={setMachineValue}
              error={fieldErrors.machineValue ?? undefined}
            />

            <Input
              ref={actualWeightRef}
              label={t('actualWeight')}
              value={actualWeight}
              onChange={setActualWeight}
              error={fieldErrors.actualWeight ?? undefined}
            />
          </VStack>
        </Card>

        {error && <Text variant="error" style={styles.error}>{error}</Text>}

        <VStack gap="sm">
          <Button title={t('calculateAdjustment')} onPress={handleCalculate} icon={<FontAwesome5 name="cog" size={20} color={theme.colors.bg} />} />
          <Button title={t('clear')} variant="secondary" onPress={clear} icon={<FontAwesome5 name="eraser" size={20} color={theme.colors.textSecondary} />} />
        </VStack>

        <HistoryList history={history} onItemPress={fillFromHistory} onClear={clearHistory} />
      </VStack>
    </ScreenLayout>
  );
};