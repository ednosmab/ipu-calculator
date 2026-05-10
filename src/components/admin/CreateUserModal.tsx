// src/components/admin/CreateUserModal.tsx
// Formulário de criação de usuário

import React from 'react';
import { View, Text, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { HStack, VStack, Button, Text as DSText, Input , theme } from '@/design-system';

interface Props {
  visible: boolean;
  onRequestClose: () => void;
  onCreateUser: (userData: {
    name: string;
    email: string;
    password: string;
    role: 'viewer' | 'editor' | 'admin';
  }) => Promise<void>;
}

export const CreateUserModal = ({ visible, onRequestClose, onCreateUser }: Props) => {
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer' as 'viewer' | 'editor' | 'admin',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!form.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'E-mail inválido';
    }
    
    if (!form.password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (form.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      await onCreateUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });
      
      // Reset form on success
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'viewer',
      });
      onRequestClose();
    } catch (err: any) {
      // Handle API errors
      if (err.response?.data?.error) {
        setErrors({ 
          submit: err.response.data.error 
        });
      } else {
        setErrors({ 
          submit: 'Erro ao criar usuário. Tente novamente.' 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.backdrop}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.modalContent}>
          <DSText style={styles.title}>Novo Usuário</DSText>
          
          <VStack style={styles.form}>
            <DSText style={styles.label}>Nome completo</DSText>
            <Input
              value={form.name}
              onChangeText={text => setForm(prev => ({ ...prev, name: text }))}
              error={!!errors.name}
              placeholder="Digite o nome completo"
              autoCapitalize="words"
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
            
            <DSText style={styles.label}>E-mail</DSText>
            <Input
              value={form.email}
              onChangeText={text => setForm(prev => ({ ...prev, email: text }))}
              error={!!errors.email}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
            
            <DSText style={styles.label}>Senha</DSText>
            <Input
              value={form.password}
              onChangeText={text => setForm(prev => ({ ...prev, password: text }))}
              error={!!errors.password}
              placeholder="••••••"
              secureTextEntry
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
            
            <DSText style={styles.label}>Role inicial</DSText>
            <View style={styles.roleSelect}>
              {['viewer', 'editor', 'admin'].map(role => (
                <View key={role} style={styles.roleOption}>
                  <Text style={styles.roleLabel}>
                    {role === 'viewer' ? 'Visualizador' : 
                     role === 'editor' ? 'Editor' : 'Administrador'}
                  </Text>
                </View>
              ))}
            </View>
          </VStack>

          {errors.submit && (
            <Text style={styles.errorText}>{errors.submit}</Text>
          )}

          <View style={styles.actions}>
            <Button
              title="Cancelar"
              onPress={onRequestClose}
              style={styles.cancelButton}
            />
            <Button
              title="Criar usuário"
              onPress={handleSubmit}
              loading={isSubmitting}
              style={styles.submitButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: theme.spacing.md,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.lg,
    maxHeight: '80%',
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.lg,
  },
  form: {
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
  },
  roleSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
  },
  roleOption: {
    padding: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.sm,
  },
  roleLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  cancelButton: {
    backgroundColor: theme.colors.border,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
});