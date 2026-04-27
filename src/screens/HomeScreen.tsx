import { ScreenLayout } from '@/components/ScreenLayout';
import { Button, Card, Text, VStack } from '@/design-system';
import { theme } from '@/design-system/theme';
import { useTranslation } from '@/i18n/TranslationContext';
import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  onGoToCalculator: () => void;
  onGoToCalibration: () => void;
  onGoToModels: () => void;
};

export const HomeScreen = ({ onGoToCalculator, onGoToCalibration, onGoToModels }: Props) => {
  const { language, toggleLanguage, t } = useTranslation();

  const HeaderTitle = language === 'pt'
    ? (
      <View style={styles.headerTitleRow}>
        <Text style={styles.headerTitlePrimary}>Calculadora</Text>
        <Text style={styles.headerTitleWhite}> IPU</Text>
      </View>
    )
    : null;

  const LanguageToggle = (
    <Pressable onPress={toggleLanguage} style={styles.languageToggle}>
      <Text style={styles.languageToggleText}>
        {language.toUpperCase()}
      </Text>
    </Pressable>
  );

  return (
    <ScreenLayout title={t('appTitle')} rightHeader={LanguageToggle} headerTitle={HeaderTitle}>
      <VStack gap="md" style={styles.content}>
        <Card style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <FontAwesome5 name="tint" size={42} color={theme.colors.primaryText} />
          </View>
          <Text style={styles.heroTitle}>{t('homeHeroTitle')}</Text>
          <Text variant="helper" style={styles.heroSubtitle}>{t('homeHeroSubtitle')}</Text>
        </Card>

        <Button title={t('calculateInjection')} onPress={onGoToCalculator} icon={<FontAwesome5 name="calculator" size={20} color={theme.colors.primaryText} />} />
        <Button title={t('calibrateFlow')} variant="secondary" onPress={onGoToCalibration} icon={<FontAwesome5 name="tint" size={20} color={theme.colors.primary} />} />

        <View style={styles.divider} />

        <Button title={t('models')} variant="secondary" onPress={onGoToModels} icon={<FontAwesome5 name="list" size={20} color={theme.colors.primary} />} />

        <Text variant="helper" style={styles.footerTagline}>
          {t('homeFooterTagline')}
        </Text>
      </VStack>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  languageToggle: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness.full,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.md,
  },
  languageToggleText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitlePrimary: {
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  headerTitleWhite: {
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.bold,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  heroCard: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    minHeight: 150,
    justifyContent: 'center',
  },
  heroIconWrap: {
    width: 96,
    height: 96,
    borderRadius: theme.roundness.md,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  heroTitle: {
    fontSize: theme.typography.sizes.md,
    textAlign: 'center',
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  heroSubtitle: {
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    opacity: 0.9,
  },
  divider: {
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  footerTagline: {
    textAlign: 'center',
    marginTop: theme.spacing.md,
    letterSpacing: 0.5,
    paddingHorizontal: theme.spacing.sm,
  },
});