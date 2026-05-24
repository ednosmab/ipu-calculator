import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ModelsScreen } from '@/features/models/screens/ModelsScreen';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Text, theme } from '@/design-system';
import { useEffect, useState } from 'react';

const OFFLINE_ACCESS_KEY = 'ipu_offline_access';

export default function Page() {
  const [hasLocalCache, setHasLocalCache] = useState(false);
  const [isCheckingCache, setIsCheckingCache] = useState(true);

  const isConnected = useNetworkStatus();
  const isOffline = isConnected === false;
  const offlineFlag = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(OFFLINE_ACCESS_KEY) : null;
  const canAccessOffline = (isOffline || offlineFlag === 'true') && hasLocalCache;

  const { isLoading: authLoading, isAuthorized } = useRequireAuth('viewer', {
    canAccessOffline,
    isCheckingCache,
  });

  useEffect(() => {
    const check = async () => {
      try {
        const { modelRepository } = await import('@/features/models/infra/modelRepository');
        const models = await modelRepository.getAll();
        setHasLocalCache(models.length > 0);
      } finally {
        setIsCheckingCache(false);
      }
    };
    check();
  }, []);

  // Clear offline flag when coming back online
  const prevConnected = usePrevious(isConnected);
  useEffect(() => {
    if (prevConnected === false && isConnected === true && offlineFlag === 'true') {
      try { sessionStorage.removeItem(OFFLINE_ACCESS_KEY); } catch {}
    }
  }, [isConnected, offlineFlag, prevConnected]);

  const showLoader = authLoading || isCheckingCache;

  if (showLoader) {
    return (
      <View style={styles.confirmingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>
          {authLoading ? 'Restaurando sessão...' : 'Verificando cache...'}
        </Text>
      </View>
    );
  }

  if (!isAuthorized && !canAccessOffline) {
    return null;
  }

  return (
    <ModelsScreen
      isOffline={isOffline}
      hasLocalCache={hasLocalCache}
    />
  );
}

const styles = StyleSheet.create({
  confirmingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
    gap: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
  },
});

/** Retorna valor anterior de uma variável */
function usePrevious<T>(value: T): T | undefined {
  const [prev, setPrev] = useState<T | undefined>(undefined);
  useEffect(() => { setPrev(value); }, [value]);
  return prev;
}
