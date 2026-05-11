import { Text, VStack, HStack } from '@/design-system';
import { theme } from '@/design-system/theme';
import { useTranslation } from '@/i18n/TranslationContext';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import React, { useState, useCallback, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Visualizador',
};

const MENU_WIDTH = 280;

export const NavMenu = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const open = useCallback(() => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, backdropAnim]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -MENU_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [slideAnim, backdropAnim]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <>
      <Pressable onPress={open} style={styles.menuButton} accessibilityLabel="Menu" accessibilityRole="button">
        <FontAwesome5 name="bars" size={20} color={theme.colors.text} />
        <Text style={styles.menuLabel}>Menu</Text>
      </Pressable>

      {visible && (
        <View style={styles.overlay} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.card,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <VStack gap="sm">
              <View style={styles.header}>
                <HStack gap="xs" style={{ alignItems: 'center' }}>
                  <FontAwesome5 name="user-circle" size={16} color={theme.colors.primary} />
                  <Text style={styles.userName}>
                    {user ? `${user.email?.split('@')[0] ?? 'Usuário'} (${ROLE_LABELS[user.role ?? 'viewer']})` : 'Visitante'}
                  </Text>
                </HStack>
                <Pressable onPress={close} style={styles.closeBtn} accessibilityLabel="Fechar menu">
                  <FontAwesome5 name="times" size={18} color={theme.colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.divider} />

              <NavItem icon="home" label="Início" active={isActive('/')} onPress={() => { close(); router.replace('/'); }} />
              <NavItem icon="calculator" label={t('injection')} active={isActive('/calculator')} onPress={() => { close(); router.push('/calculator'); }} />
              <NavItem icon="tint" label={t('calibration')} active={isActive('/calibration')} onPress={() => { close(); router.push('/calibration'); }} />
              <NavItem icon="list" label={t('models')} active={isActive('/models')} onPress={() => { close(); router.push('/models'); }} />

              {user?.role === 'admin' && (
                <>
                  <View style={styles.divider} />
                  <NavItem icon="cog" label="Painel Admin" active={isActive('/admin')} onPress={() => { close(); router.push('/admin'); }} />
                </>
              )}

              <View style={styles.divider} />

              {user ? (
                <NavItem icon="sign-out-alt" label="Sair" variant="danger" onPress={async () => { close(); await signOut(); router.replace('/'); }} />
              ) : (
                <NavItem icon="sign-in-alt" label="Entrar" onPress={() => { close(); router.push('/login'); }} />
              )}

              <View style={styles.footer}>
                <Text style={styles.version}>v{process.env.EXPO_PUBLIC_APP_VERSION ?? '1.0.0'}</Text>
              </View>
            </VStack>
          </Animated.View>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            ]}
            pointerEvents="auto"
          >
            <Pressable style={styles.backdropTouchable} onPress={close} />
          </Animated.View>
        </View>
      )}
    </>
  );
};

const NavItem = ({ icon, label, onPress, variant, active }: { icon: string; label: string; onPress: () => void; variant?: 'danger'; active?: boolean }) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.navItem,
      variant === 'danger' && styles.navItemDanger,
      active && styles.navItemActive,
    ]}
    accessibilityRole="button"
  >
    <HStack gap="sm" style={{ alignItems: 'center' }}>
      <FontAwesome5 name={icon as any} size={16} color={active ? theme.colors.primary : (variant === 'danger' ? theme.colors.error : theme.colors.textSecondary)} />
      <Text style={[
        styles.navLabel,
        variant === 'danger' && styles.navLabelDanger,
        active && styles.navLabelActive,
      ]}>{label}</Text>
    </HStack>
  </Pressable>
);

const styles = StyleSheet.create({
  menuButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 12 : 48,
    left: 12,
    width: 52,
    height: 44,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    zIndex: 9998,
  },
  menuLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 9999,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  backdropTouchable: {
    flex: 1,
  },
  card: {
    width: MENU_WIDTH,
    backgroundColor: theme.colors.surface,
    paddingTop: Platform.OS === 'web' ? 60 : 80,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderTopRightRadius: theme.roundness.lg,
    borderBottomRightRadius: theme.roundness.lg,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  userName: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  navItem: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.roundness.sm,
  },
  navItemActive: {
    backgroundColor: `${theme.colors.primary}18`,
  },
  navItemDanger: {
    backgroundColor: `${theme.colors.error}0d`,
  },
  navLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  navLabelActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  navLabelDanger: {
    color: theme.colors.error,
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  version: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
});
