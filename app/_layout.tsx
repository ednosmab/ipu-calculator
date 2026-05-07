import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { DebugPanel } from '@/components/DebugPanel';
import { TranslationProvider, useTranslation } from '@/i18n/TranslationContext';
import { Button, Text, theme } from '@/design-system';
import { useSyncEngine } from '@/hooks/useSyncEngine';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';
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

function Fallback({ error }: { error: Error }) {
  const handleReset = () => {
    // Force page reload to reset ErrorBoundary
    window.location.reload();
  };
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#dc3545', marginBottom: 8 }}>
        Algo deu errado
      </Text>
      <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 }}>
        {error.message}
      </Text>
      <Button
        title="Tentar novamente"
        onPress={handleReset}
        style={{ minWidth: 180 }}
      />
    </View>
  );
}

function AppContent() {
  const isStaging = process.env.EXPO_PUBLIC_APP_ENV === 'staging';
  const [loaded, error] = Font.useFonts({
    ...FontAwesome5.font,
  });
  const [isMounted, setIsMounted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const { updateAvailable, dismissUpdate } = useServiceWorkerUpdate();
  const { debugInfo } = usePWAInstall();

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
    <AuthProvider>
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

          {/* Debug button — staging only */}
          {isStaging && (
            <Pressable onPress={() => setShowDebug(!showDebug)} style={styles.debugButton}>
              <FontAwesome5 name="bug" size={14} color={theme.colors.textSecondary} />
            </Pressable>
          )}

          <DebugPanel visible={showDebug} debugInfo={debugInfo} />
        </ErrorBoundary>
      </TranslationProvider>
    </AuthProvider>
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
  debugButton: {
    position: 'absolute' as const,
    bottom: 30,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121418',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#2C3036',
    zIndex: 9999,
  },
};