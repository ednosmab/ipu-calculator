import { ErrorBoundary, Text, theme } from '@/design-system';
import { useSyncEngine } from '@/hooks/useSyncEngine';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';
import { UpdateBanner } from '@/components/UpdateBanner';
import { TranslationProvider } from '@/i18n/TranslationContext';
import { PWAInstallProvider, usePWAInstall } from '@/hooks/usePWAInstall';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform, Pressable, View, ScrollView } from 'react-native';
import { registerBackgroundSync } from '@/core/sync/backgroundSyncService';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

SplashScreen.preventAutoHideAsync();

const installPillTextColor = theme.colors.primaryText;
const installPillIconColor = theme.colors.primaryText;

function Fallback({ error }: { error: Error }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg, backgroundColor: theme.colors.bg }}>
      <Text style={{ fontSize: theme.typography.sizes.lg, fontWeight: theme.typography.weights.bold, color: theme.colors.error, marginBottom: theme.spacing.sm }}>
        Algo deu errado
      </Text>
      <Text style={{ fontSize: theme.typography.sizes.md, color: theme.colors.textSecondary, textAlign: 'center' }}>
        {error.message}
      </Text>
    </View>
  );
}

function AppContent() {
  const [loaded, error] = Font.useFonts({
    ...FontAwesome5.font,
  });
  const [isMounted, setIsMounted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const { updateAvailable, refreshApp, dismissUpdate } = useServiceWorkerUpdate();
  const { canInstall, hasUpdate, install, dismiss, debugInfo } = usePWAInstall();

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useSyncEngine();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      registerBackgroundSync().catch(console.error);
    }
  }, []);

  if (!isMounted || (!loaded && !error)) {
    return <LoadingSkeleton />;
  }

  return (
    <TranslationProvider>
      <Head>
        <title>Calculadora IPU</title>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/assets/images/icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </Head>
      <ErrorBoundary fallback={({ error }: { error: Error }) => <Fallback error={error} />}>
        <Stack screenOptions={{ headerShown: false }} />

        {canInstall && (
          <View style={styles.pillContainer}>
            <Pressable onPress={install} style={styles.pillButton}>
              <FontAwesome5 name="download" size={14} color={installPillIconColor} style={{ marginRight: 8 }} />
              <Text style={styles.pillText}>{hasUpdate ? 'Atualizar App' : 'Instalar App'}</Text>
            </Pressable>
            <Pressable onPress={dismiss} style={styles.pillClose}>
              <FontAwesome5 name="times" size={14} color={theme.colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => setShowDebug(!showDebug)} style={[styles.pillClose, { marginLeft: 8, width: 28, height: 28 }]}>
              <FontAwesome5 name="bug" size={12} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        )}

        {showDebug && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>{debugInfo}</Text>
          </View>
        )}

        {updateAvailable && (
          <UpdateBanner onRefresh={refreshApp} onDismiss={dismissUpdate} />
        )}
      </ErrorBoundary>
    </TranslationProvider>
  );
}

export default function RootLayout() {
  return (
    <PWAInstallProvider>
      <AppContent />
    </PWAInstallProvider>
  );
}

const styles = {
  pillContainer: {
    position: 'absolute' as const,
    bottom: 30,
    alignSelf: 'center' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    zIndex: 9999,
  },
  pillButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
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
    color: installPillTextColor,
    fontWeight: 'bold' as const,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  pillClose: {
    backgroundColor: theme.colors.surface,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  debugContainer: {
    position: 'absolute' as const,
    bottom: 100,
    left: 10,
    right: 10,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    zIndex: 9998,
  },
  debugText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontFamily: 'monospace',
  }
};