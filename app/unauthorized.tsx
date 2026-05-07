// app/unauthorized.tsx
// Tela exibida quando o usuário não tem o role necessário

import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, theme } from '@/design-system';

export default function UnauthorizedScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Acesso negado</Text>
      <Text style={styles.subtitle}>
        Você não tem permissão para acessar esta área.
      </Text>
      <Button title="Voltar" onPress={() => router.replace('/')} />
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
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
