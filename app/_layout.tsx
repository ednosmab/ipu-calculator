import { Stack } from 'expo-router';
import { ErrorBoundary, theme, Text } from '@/design-system';
import { View } from 'react-native';
import { TranslationProvider } from '@/i18n/TranslationContext';
import { useSyncEngine } from '@/hooks/useSyncEngine';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

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

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useSyncEngine();
  
  if (!loaded && !error) {
    return null;
  }

  return (
    <TranslationProvider>
      <ErrorBoundary fallback={({ error }: { error: Error }) => <Fallback error={error} />}>
        <Stack screenOptions={{ headerShown: false }} />
      </ErrorBoundary>
    </TranslationProvider>
  );
}