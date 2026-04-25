import { logService } from '@/core/logging/LogService';
import { Button, Input, Card, theme, HStack, VStack, Text } from '@/design-system';
import { ResultCard } from '@/components/ResultCard';
import { HistoryList } from '@/components/HistoryList';
import { ScreenLayout, ScreenLayoutRef } from '@/components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { useIPUCalculator } from '../hooks/useIPUCalculator';
import { useTranslation } from '@/i18n/TranslationContext';
import { styles } from './IPUScreen.styles';
import { useRef } from 'react';

type Props = {
  goBack: () => void;
  goToCalibration: () => void;
};

export const IPUScreen = ({ goBack, goToCalibration }: Props) => {
  const screenRef = useRef<ScreenLayoutRef>(null);
  const { t } = useTranslation();
  const { 
    isocyanate, 
    polyol, 
    setIsocyanate, 
    setPolyol, 
    result, 
    error, 
    fieldErrors,
    calculate, 
    clear,
    history,
    clearHistory,
    fillFromHistory 
  } = useIPUCalculator();

  const handleCalculate = () => {
    logService.info('IPU calculation started', { isocyanate, polyol });
    if (fieldErrors.polyol || fieldErrors.isocyanate) {
      logService.warn('Validation failed', { fieldErrors });
    }
    calculate();
    setTimeout(() => screenRef.current?.scrollToTop(), 150);
  };

  return (
    <ScreenLayout
      ref={screenRef}
      title={t('calculateInjection')}
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
            title={t('goToCalibration')}
            onPress={goToCalibration}
            style={{ flex: 1 }}
          />
        </HStack>
      }
    >
      <VStack gap="lg">
        <ResultCard result={result} />

        <Card>
          <VStack>
            <Input
              label={t('isocyanate')}
              value={isocyanate}
              onChange={setIsocyanate}
              error={fieldErrors.isocyanate ?? undefined}
              keyboardType="numeric"
            />
            <Input
              label={t('polyol')}
              value={polyol}
              onChange={setPolyol}
              error={fieldErrors.polyol ?? undefined}
              keyboardType="numeric"
            />
          </VStack>
        </Card>

        {error && <Text variant="error" style={styles.error}>{error}</Text>}

        <VStack gap="sm">
          <Button title={t('calculateInjection')} onPress={handleCalculate} />
          <Button title={t('clear')} variant="secondary" onPress={clear} />
        </VStack>

        <HistoryList history={history} onItemPress={fillFromHistory} onClear={clearHistory} />
      </VStack>
    </ScreenLayout>
  );
};