import { ScreenLayout } from '@/components/ScreenLayout';
import { Button, Card, Text, VStack, HStack } from '@/design-system';
import { Title } from '@/components/Title';
import { theme } from '@/design-system/theme';
import { useTranslation } from '@/i18n/TranslationContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';
import { FontAwesome5 } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View, Modal } from 'react-native';

type Props = {
  onGoToCalculator: () => void;
  onGoToCalibration: () => void;
  onGoToModels: () => void;
};

export const HomeScreen = ({ onGoToCalculator, onGoToCalibration, onGoToModels }: Props) => {
  const { language, toggleLanguage, t } = useTranslation();
  const { canInstall, isStandalone, install, dismiss, resetDismissStatus } = usePWAInstall();
  const { updateAvailable, dismissUpdate } = useServiceWorkerUpdate();
  const [showSettings, setShowSettings] = useState(false);

  const showPwaPill = canInstall || (isStandalone && updateAvailable);
  const pwaPillLabel = (isStandalone && updateAvailable) ? 'Atualizar App' : 'Instalar App';

  const handlePwaAction = () => {
    if (isStandalone && updateAvailable) {
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert('Uma nova versão está disponível!\n\nPara aplicar as novidades, feche o aplicativo completamente e abra-o novamente.');
      } else {
        alert('Uma nova versão está disponível!\n\nFeche o aplicativo e abra-o novamente para atualizar para a versão mais recente.');
      }
      dismissUpdate();
    } else {
      install();
    }
  };

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

  const FooterSettings = (
    <Pressable onPress={() => setShowSettings(true)} style={styles.settingsButton}>
      <FontAwesome5 name="cog" size={20} color={theme.colors.text} />
    </Pressable>
  );

  return (
    <ScreenLayout 
      title={t('appTitle')} 
      rightHeader={LanguageToggle} 
      headerTitle={HeaderTitle}
      footer={FooterSettings}
    >
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

      {showPwaPill && (
        <View style={styles.pillContainer}>
          <Pressable onPress={handlePwaAction} style={styles.pillButton}>
            <FontAwesome5 
              name={(isStandalone && updateAvailable) ? "sync-alt" : "download"} 
              size={14} 
              color={theme.colors.primaryText} 
              style={{ marginRight: 8 }} 
            />
            <Text style={styles.pillText}>{pwaPillLabel}</Text>
          </Pressable>
          <Pressable 
            onPress={() => {
              dismiss();
              if (updateAvailable) dismissUpdate();
            }} 
            style={styles.pillClose}
          >
            <FontAwesome5 name="times" size={14} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      )}

      <Modal
        transparent
        visible={showSettings}
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <VStack gap="md">
              <Text variant="title" style={{ textAlign: 'center' }}>Configurações</Text>
              
              <Button 
                title="Instalar App" 
                variant="secondary" 
                onPress={() => {
                  install();
                  setShowSettings(false);
                }}
                icon={<FontAwesome5 name="download" size={16} color={theme.colors.primary} />}
              />

              <Button 
                title="Fechar" 
                variant="secondary" 
                onPress={() => setShowSettings(false)} 
              />
            </VStack>
          </Card>
        </View>
      </Modal>
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
  footerTaglineText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    flex: 1,
  },
  settingsButton: {
    padding: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.xs,
  },
  pillContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
  },
  pillButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  pillText: {
    color: theme.colors.primaryText,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  pillClose: {
    backgroundColor: theme.colors.surface,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    padding: theme.spacing.lg,
  },
});