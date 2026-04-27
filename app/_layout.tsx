import { ErrorBoundary, Text, theme } from '@/design-system';
import { useSyncEngine } from '@/hooks/useSyncEngine';
import { TranslationProvider } from '@/i18n/TranslationContext';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

SplashScreen.preventAutoHideAsync();

const installPillTextColor = theme.colors.primaryText;
const installPillIconColor = theme.colors.primaryText;

// UI Version: 1.0.2 - Forçando atualização de cores do PWA
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

export default function RootLayout() {
  const [loaded, error] = Font.useFonts({
    ...FontAwesome5.font,
  });
  const [isMounted, setIsMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // 1. Verificação de iOS (Instrução Manual)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    if (isIOS && !isStandalone) {
      setShowIOSBanner(true);
    }

    // 2. Gerenciamento do Prompt de Instalação (Android/Chrome)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Registro do Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(console.error);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: Usuário escolheu ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  useSyncEngine();

  if (!isMounted || (!loaded && !error)) {
    return null;
  }

  return (
    <TranslationProvider>
      <Head>
        <title>Calculadora IPU</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </Head>
      <ErrorBoundary fallback={({ error }: { error: Error }) => <Fallback error={error} />}>
        <Stack screenOptions={{ headerShown: false }} />

        {/* Botão de Instalação Discreto (Pill) */}
        {showInstallBanner && (
          <View style={styles.pillContainer}>
            <Pressable onPress={handleInstallClick} style={styles.pillButton}>
              <FontAwesome5 name="download" size={14} color={installPillIconColor} style={{ marginRight: 8 }} />
              <Text style={styles.pillText}>Instalar App</Text>
            </Pressable>
            <Pressable onPress={() => setShowInstallBanner(false)} style={styles.pillClose}>
              <FontAwesome5 name="times" size={14} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        )}

        {/* Instrução iOS Discreta (Pill) */}
        {showIOSBanner && (
          <View style={styles.pillContainer}>
            <View style={[styles.pillButton, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.primary }]}>
              <FontAwesome5 name="share" size={14} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.pillText, { color: theme.colors.text }]}>Instalar no iPhone</Text>
            </View>
            <Pressable onPress={() => setShowIOSBanner(false)} style={styles.pillClose}>
              <FontAwesome5 name="times" size={14} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        )}
      </ErrorBoundary>
    </TranslationProvider>
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
  }
};