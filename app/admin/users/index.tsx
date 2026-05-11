// app/admin/users/index.tsx
// Lista de usuários do painel admin

import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { Button, theme } from '@/design-system';
import { ScreenLayout } from '@/components/ScreenLayout';
import { UserTable } from '@/components/admin/UserTable';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import { useTranslation } from '@/i18n/TranslationContext';

export default function UsersScreen() {
  const { isAuthorized } = useRequireAuth('admin');
  const { user: authUser } = useAuth();
  const { users, isLoading, error, createUser, updateUser, deleteUser, refetch } = useAdminUsers();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

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
      console.error('Error creating user:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const footer = (
    <View style={styles.fabWrapper}>
      <Button
        title={t('createUser')}
        onPress={() => setModalVisible(true)}
        style={styles.fabButton}
        icon={<FontAwesome5 name="plus" size={20} color={theme.colors.bg} />}
      />
    </View>
  );

  if (isLoading && users.length === 0) {
    return (
      <ScreenLayout title="Gestão de Usuários">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando usuários...</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (error) {
    return (
      <ScreenLayout title="Gestão de Usuários">
        <View style={styles.center}>
          <Text style={styles.errorText}>Erro ao carregar usuários</Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <Button
            title="Tentar novamente"
            onPress={refetch}
            variant="secondary"
            style={{ marginTop: theme.spacing.lg }}
          />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Gestão de Usuários" footer={footer}>
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
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
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
  content: {
    flex: 1,
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
  fabWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
  },
  fabButton: {
    minWidth: 120,
  },
});