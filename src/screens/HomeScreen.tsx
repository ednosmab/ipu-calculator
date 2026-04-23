import React from 'react';
import { Button, VStack, Text } from '@/design-system';
import { theme } from '@/design-system/theme';
import { ScreenLayout } from '@/components/ScreenLayout';
import { useTranslation } from '@/i18n/TranslationContext';

type Props = {
  onGoToCalculator: () => void;
  onGoToCalibration: () => void;
};

export const HomeScreen = ({ onGoToCalculator, onGoToCalibration }: Props) => {
  const { language, toggleLanguage, t } = useTranslation();

  const LanguageToggle = (
    <Text
      onPress={toggleLanguage}
      style={{
        color: theme.colors.primary,
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.bold,
      }}
    >
      {language.toUpperCase()}
    </Text>
  );

  return (
    <ScreenLayout title={t('appTitle')} centered rightHeader={LanguageToggle}>
      <VStack gap="md">
        <Button title={t('calculateInjection')} onPress={onGoToCalculator} />
        <Button title={t('calibrateFlow')} variant="secondary" onPress={onGoToCalibration} />
      </VStack>
    </ScreenLayout>
  );
};