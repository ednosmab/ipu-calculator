import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ModelsScreen } from '@/features/models/screens/ModelsScreen';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { theme } from '@/design-system';

export default function Page() {
  const { isLoading: authLoading, isAuthorized, isOffline, hasLocalCache, isConfirmingNetwork } = useRequireAuth('viewer', true);
  const showLoader = authLoading || isConfirmingNetwork;

  if (showLoader) {
    return (
      <View style={styles.confirmingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isAuthorized) {
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
  },
});
