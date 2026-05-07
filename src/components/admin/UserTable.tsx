// src/components/admin/UserTable.tsx
// Tabela de usuários com ações inline

import React from 'react';
import { View, Text, StyleSheet, FlatList, Switch, Modal, TextInput } from 'react-native';
import { HStack, VStack, Button, Text as DSText, Input } from '@/design-system';
import { theme } from '@/design-system';

interface Props {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: 'viewer' | 'editor' | 'admin';
    active: boolean;
    last_seen: string | null;
  }>;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const UserTable = ({ users, onRefresh, refreshing }: Props) => {
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [editedRole, setEditedRole] = React.useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [editedActive, setEditedActive] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const roles: Array<{ label: string; value: 'viewer' | 'editor' | 'admin' }> = [
    { label: 'Visualizador', value: 'viewer' },
    { label: 'Editor', value: 'editor' },
    { label: 'Administrador', value: 'admin' },
  ];

  const openEditModal = (user: any) => {
    setEditingUserId(user.id);
    setEditedRole(user.role);
    setEditedActive(user.active);
    setEditError(null);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingUserId(null);
    setEditError(null);
  };

  const handleSave = async () => {
    if (!editingUserId) return;

    setIsSaving(true);
    setEditError(null);

    try {
      // In a real app, we would call an API endpoint here
      // For now, we'll just simulate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Notify parent to refetch (we would normally call a callback prop)
      // Since we don't have a refetch callback, we'll just close the modal
      closeEditModal();
    } catch (err) {
      setEditError('Falha ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <VStack style={styles.info}>
        <DSText style={styles.name}>{item.name}</DSText>
        <DSText style={styles.detail}>{item.email}</DSText>
      </VStack>
      
      <VStack style={styles.actions}>
        <DSText style={styles.label}>Role</DSText>
        {/* In a real app, this would be a proper select dropdown */}
        <DSText style={styles.value}>
          {roles.find(r => r.value === item.role)?.label}
        </DSText>
        
        <DSText style={styles.label}>Status</DSText>
        <Switch
          value={item.active}
          // onValueChange would normally trigger an update
          disabled={true} // We'll handle updates via the edit modal
        />
        
        <DSText style={styles.label}>Último acesso</DSText>
        <DSText style={styles.value}>
          {item.last_seen ? new Date(item.last_seen).toLocaleString() : 'Nunca'}
        </DSText>
        
        <Button
          title="Editar"
          onPress={() => openEditModal(item)}
          style={styles.editButton}
          size="sm"
        />
      </VStack>
    </View>
  );

  return (
    <View style={styles.container}>
      {users.length > 0 ? (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || false}
              onRefresh={onRefresh}
            />
          }
        />
      ) : (
        <View style={styles.empty}>
          <DSText>Nenhum usuário encontrado</DSText>
        </View>
      )}
      
      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <DSText style={styles.modalTitle}>Editar Usuário</DSText>
            
            {editError && (
              <View style={styles.errorBox}>
                <DSText style={styles.errorText}>{editError}</DSText>
              </View>
            )}
            
            <VStack style={styles.modalForm}>
              <DSText style={styles.label}>Role</DSText>
              {/* In a real app, we would use a proper Picker or Select component */}
              <DSText style={styles.placeholder}>
                {roles.find(r => r.value === editedRole)?.label}
              </DSText>
              
              <DSText style={styles.label}>Status</DSText>
              <Switch
                value={editedActive}
                onValueChange={setEditedActive}
              />
            </VStack>
            
            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                onPress={closeEditModal}
                style={styles.cancelButton}
              />
              <Button
                title="Salvar"
                onPress={handleSave}
                loading={isSaving}
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Simplified RefreshControl for web compatibility
const RefreshControl = ({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) => {
  // In a real implementation, this would be a proper pull-to-refresh component
  // For now, we'll just return null as we handle refresh via button in header
  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  info: {
    flex: 2,
  },
  actions: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  name: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  detail: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.lg,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.md,
  },
  modalForm: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  cancelButton: {
    backgroundColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  errorBox: {
    backgroundColor: `${theme.colors.error}18`,
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.roundness.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
  },
  editButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
});