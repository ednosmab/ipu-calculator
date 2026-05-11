// app/admin/users/index.tsx
// Lista de usuários do painel admin

import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, FlatList } from 'react-native';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { Button, HStack, theme } from '@/design-system';
import { UserTable } from '@/components/admin/UserTable';
import { CreateUserModal } from '@/components/admin/CreateUserModal';

export default function UsersScreen() {
  const { isAuthorized } = useRequireAuth('admin');
  const { user: authUser } = useAuth();
  const { users, isLoading, error, createUser, updateUser, deleteUser, refetch } = useAdminUsers();
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

  if (isLoading && users.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loading}>Carregando usuários...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Erro ao carregar usuários</Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <Button title="Tentar novamente" onPress={refetch} variant="secondary" style={{ marginTop: theme.spacing.lg }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HStack style={styles.header}>
        <Text style={styles.title}>Gestão de Usuários</Text>
        <Button 
          title="Novo usuário" 
          onPress={() => setModalVisible(true)} 
          size="sm"
          style={styles.headerButton}
        />
      </HStack>
      
      <CreateUserModal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        onCreateUser={handleCreateUser}
      />
      
      <View style={styles.content}>
        {users.length > 0 ? (
          <UserTable 
            users={users} 
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            currentUserId={authUser?.id}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    textAlign: 'center',
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  headerButton: {
    marginVertical: 0,
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.bg,
  },
  error: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.sm,
  },
  errorDetail: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
});