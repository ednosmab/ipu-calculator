import { ScreenLayout } from '@/components/ScreenLayout';
import { Button, Card, Text, VStack, HStack } from '@/design-system';
import { theme } from '@/design-system/theme';
import { useTranslation } from '@/i18n/TranslationContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View, Modal, useWindowDimensions } from 'react-native';

type Props = {
  onGoToCalculator: () => void;
  onGoToCalibration: () => void;
  onGoToModels: () => void;
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Visualizador',
};

export const HomeScreen = ({ onGoToCalculator, onGoToCalibration, onGoToModels }: Props) => {
  const { language, toggleLanguage, t } = useTranslation();
  const { canInstall, isStandalone, install, dismiss, resetDismissStatus } = usePWAInstall();
  const { updateAvailable, dismissUpdate } = useServiceWorkerUpdate();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showNavMenu, setShowNavMenu] = useState(false);

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

  const FooterNav = (
    <Pressable onPress={() => setShowNavMenu(true)} style={styles.menuButton}>
      <FontAwesome5 name="bars" size={20} color={theme.colors.text} />
    </Pressable>
  );

  return (
    <ScreenLayout 
      title={t('appTitle')} 
      rightHeader={LanguageToggle} 
      headerTitle={HeaderTitle}
      footer={FooterNav}
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
        visible={showNavMenu}
        animationType="slide"
        onRequestClose={() => setShowNavMenu(false)}
      >
        <View style={styles.menuOverlay}>
          <View style={styles.menuCard}>
            <VStack gap="sm">
              <View style={styles.menuHeader}>
                <HStack gap="xs" style={{ alignItems: 'center' }}>
                  <FontAwesome5 name="user-circle" size={16} color={theme.colors.primary} />
                  <Text style={styles.menuUserName}>
                    {user ? `${user.email?.split('@')[0] ?? 'Usuário'} (${ROLE_LABELS[user.role ?? 'viewer']})` : 'Visitante'}
                  </Text>
                </HStack>
                <Pressable onPress={() => setShowNavMenu(false)} style={styles.menuCloseBtn}>
                  <FontAwesome5 name="times" size={18} color={theme.colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.menuDivider} />

              <NavItem
                icon="home"
                label="Início"
                onPress={() => {
                  setShowNavMenu(false);
                  router.replace('/');
                }}
              />
              <NavItem
                icon="calculator"
                label={t('injection')}
                onPress={() => {
                  setShowNavMenu(false);
                  router.push('/calculator');
                }}
              />
              <NavItem
                icon="tint"
                label={t('calibration')}
                onPress={() => {
                  setShowNavMenu(false);
                  router.push('/calibration');
                }}
              />
              <NavItem
                icon="list"
                label={t('models')}
                onPress={() => {
                  setShowNavMenu(false);
                  router.push('/models');
                }}
              />

              {user?.role === 'admin' && (
                <>
                  <View style={styles.menuDivider} />
                  <NavItem
                    icon="cog"
                    label="Painel Admin"
                    onPress={() => {
                      setShowNavMenu(false);
                      router.push('/admin');
                    }}
                  />
                </>
              )}

              <View style={styles.menuDivider} />

              {user ? (
                <NavItem
                  icon="sign-out-alt"
                  label="Sair"
                  variant="danger"
                  onPress={async () => {
                    setShowNavMenu(false);
                    await signOut();
                    router.replace('/');
                  }}
                />
              ) : (
                <NavItem
                  icon="sign-in-alt"
                  label="Entrar"
                  onPress={() => {
                    setShowNavMenu(false);
                    router.push('/login');
                  }}
                />
              )}

              <View style={styles.menuFooter}>
                <Text style={styles.menuVersion}>v{process.env.EXPO_PUBLIC_APP_VERSION ?? '1.0.0'}</Text>
              </View>
            </VStack>
          </View>
          <Pressable style={styles.menuBackdrop} onPress={() => setShowNavMenu(false)} />
        </View>
      </Modal>
    </ScreenLayout>
  );
};

const NavItem = ({ icon, label, onPress, variant }: { icon: string; label: string; onPress: () => void; variant?: 'danger' }) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.navItem,
      variant === 'danger' && styles.navItemDanger,
    ]}
  >
    <HStack gap="sm" style={{ alignItems: 'center' }}>
      <FontAwesome5
        name={icon as any}
        size={16}
        color={variant === 'danger' ? theme.colors.error : theme.colors.textSecondary}
      />
      <Text
        style={[
          styles.navLabel,
          variant === 'danger' && styles.navLabelDanger,
        ]}
      >
        {label}
      </Text>
    </HStack>
  </Pressable>
);

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
  menuButton: {
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
  menuOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuCard: {
    width: 280,
    backgroundColor: theme.colors.surface,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderTopRightRadius: theme.roundness.lg,
    borderBottomRightRadius: theme.roundness.lg,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  menuUserName: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  menuCloseBtn: {
    padding: theme.spacing.xs,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  navItem: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.roundness.sm,
  },
  navItemDanger: {
    backgroundColor: `${theme.colors.error}0d`,
  },
  navLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  navLabelDanger: {
    color: theme.colors.error,
  },
  menuFooter: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  menuVersion: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
});
