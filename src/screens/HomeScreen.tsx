import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Button, VStack, Text } from '@/design-system';
import { theme } from '@/design-system/theme';
import { ScreenLayout } from '@/components/ScreenLayout';
import { useTranslation } from '@/i18n/TranslationContext';

type Props = {
  onGoToCalculator: () => void;
  onGoToCalibration: () => void;
  onGoToModels: () => void;
};

export const HomeScreen = ({ onGoToCalculator, onGoToCalibration, onGoToModels }: Props) => {
  const { language, toggleLanguage, t } = useTranslation();

  const LanguageToggle = (
    <Pressable onPress={toggleLanguage}>
      <Text
        style={{
          color: theme.colors.primary,
          fontSize: theme.typography.sizes.md,
          fontWeight: theme.typography.weights.bold,
        }}
      >
        {language.toUpperCase()}
      </Text>
    </Pressable>
  );

  return (
    <ScreenLayout title={t('appTitle')} centered rightHeader={LanguageToggle}>
      <VStack gap="md">
        <Button title={t('calculateInjection')} onPress={onGoToCalculator} />
        <Button title={t('calibrateFlow')} variant="secondary" onPress={onGoToCalibration} />
        
        <View style={styles.divider} />
        
        <Button title={t('models')} variant="ghost" onPress={onGoToModels} />
      </VStack>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  divider: {
    marginTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.lg,
  },
});