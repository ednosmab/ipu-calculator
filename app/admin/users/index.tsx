// app/admin/users/index.tsx
// Lista de usuários do painel admin

import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, FlatList } from 'react-native';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Button , theme } from '@/design-system';
import { UserTable } from '@/components/admin/UserTable';
import { CreateUserModal } from '@/components/admin/CreateUserModal';

export default function UsersScreen() {
  const { isAuthorized } = useRequireAuth('admin');
  const { users, isLoading, error, createUser, refetch } = useAdminUsers();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!isAuthorized) {
    return null;
  }

  const handleCreateUser = async (userData: {
    name: string;
    email: string;
    password: string;
    role: 'viewer' | 'editor' | 'admin';
  }) => {
    try {
      await createUser(userData);
      setModalVisible(false);
    } catch (err) {
      // Error will be handled by the modal or we could show a toast
      console.error('Error creating user:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loading}>Carregando usuários...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Erro: {error}</Text>
        <Button title="Tentar novamente" onPress={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestão de Usuários</Text>
        <View style={styles.actions}>
          <Button title="Novo usuário" onPress={() => setModalVisible(true)} />
        </View>
      </View>
      
      <CreateUserModal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        onCreateUser={handleCreateUser}
      />
      
      <View style={styles.content}>
        {users.length > 0 ? (
          <UserTable 
            users={users} 
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
  },
  loading: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
});