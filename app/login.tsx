// app/login.tsx
// Tela de login — modal antes de acessar /models
// Sem opção de auto-cadastro; feedback por tipo de erro

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Button, theme } from '@/design-system';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getPostLoginRedirect } from '@/hooks/useRequireAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { modelRepository } from '@/features/models/infra/modelRepository';
import { useEffect } from 'react';

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'E-mail ou senha inválidos.',
  ACCOUNT_SUSPENDED: 'Sua conta foi suspensa. Contate o administrador.',
  INTERNAL_ERROR: 'Erro interno. Tente novamente.',
};

export default function LoginScreen() {
  const { signIn, profile } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const isConnected = useNetworkStatus();
  const [hasCache, setHasCache] = useState(false);

  useEffect(() => {
    modelRepository.getAll().then(models => {
      setHasCache(models.length > 0);
    });
  }, []);

  const handleAccessOffline = () => {
    router.replace('/models');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorCode('INVALID_PAYLOAD');
      return;
    }

    setErrorCode(null);
    setIsLoading(true);

    try {
      await signIn(email.trim(), password);
      const redirect = getPostLoginRedirect(profile?.role);
      router.replace(redirect);
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : 'INTERNAL_ERROR';
      setErrorCode(code);
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage =
    errorCode === 'INVALID_PAYLOAD'
      ? 'Preencha e-mail e senha.'
      : ERROR_MESSAGES[errorCode ?? ''] ?? ERROR_MESSAGES.INTERNAL_ERROR;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>IPU Calculator</Text>
          <Text style={styles.title}>Acesso restrito</Text>
          <Text style={styles.subtitle}>
            Faça login para acessar os Modelos
          </Text>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            accessibilityLabel="Campo de e-mail"
            testID="login-email-input"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.textSecondary}
            secureTextEntry
            editable={!isLoading}
            onSubmitEditing={handleLogin}
            accessibilityLabel="Campo de senha"
            testID="login-password-input"
          />

          {/* Feedback de erro */}
          {errorCode && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Botão de login */}
          <Button
            title="Entrar"
            onPress={handleLogin}
            disabled={isLoading}
            loading={isLoading}
            testID="login-submit-button"
          />

          {/* Botão de acesso offline se estiver sem rede e houver cache */}
          {isConnected !== true && hasCache && (
            <Button
              title="Acessar Offline (Cache)"
              variant="secondary"
              onPress={handleAccessOffline}
              style={styles.offlineButton}
              icon={<FontAwesome5 name="wifi" size={16} color={theme.colors.warning} />}
            />
          )}

          <Text style={styles.note}>
            Sem conta? Solicite acesso ao administrador.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bg },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  brand: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: 2,
    marginTop: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.sm,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  errorBox: {
    backgroundColor: `${theme.colors.error}18`,
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.roundness.sm,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
  },
  note: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  offlineButton: {
    marginTop: theme.spacing.sm,
    borderColor: theme.colors.warning,
  },
});
