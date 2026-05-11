// app/suspended.tsx
// Tela exibida quando a conta do usuário está suspensa

import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Button, theme } from '@/design-system';

export default function SuspendedScreen() {
  const { signOut } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⛔</Text>
      <Text style={styles.title}>Conta suspensa</Text>
      <Text style={styles.subtitle}>
        Sua conta foi suspensa. Entre em contato com o administrador para
        reativar o acesso.
      </Text>
      <Button title="Sair" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.bg,
    gap: theme.spacing.md,
  },
  icon: { fontSize: 48 },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.error,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
