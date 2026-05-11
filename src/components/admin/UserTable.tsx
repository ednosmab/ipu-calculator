// src/components/admin/UserTable.tsx
// Tabela de usuários com ações inline

import React from 'react';
import { View, Text, StyleSheet, FlatList, Switch, Modal, TextInput, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { HStack, VStack, Button, Text as DSText, Input , theme } from '@/design-system';
import { FontAwesome5 } from '@expo/vector-icons';

interface Props {
  users: {
    id: string;
    name: string;
    email: string;
    role: 'viewer' | 'editor' | 'admin';
    active: boolean;
    last_seen: string | null;
  }[];
  onUpdateUser?: (id: string, data: Partial<{ role: 'viewer' | 'editor' | 'admin'; active: boolean }>) => Promise<void>;
  onDeleteUser?: (id: string) => Promise<void>;
  onRefresh?: () => void;
  refreshing?: boolean;
  currentUserId?: string;
}

export const UserTable = ({ users, onUpdateUser, onDeleteUser, onRefresh, refreshing, currentUserId }: Props) => {
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [editedRole, setEditedRole] = React.useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [editedActive, setEditedActive] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [deletingUserId, setDeletingUserId] = React.useState<string | null>(null);
  const [deletingUserName, setDeletingUserName] = React.useState('');
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const roles: { label: string; value: 'viewer' | 'editor' | 'admin' }[] = [
    { label: 'Visualizador', value: 'viewer' },
    { label: 'Editor', value: 'editor' },
    { label: 'Admin', value: 'admin' },
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
    if (!editingUserId || !onUpdateUser) return;

    setIsSaving(true);
    setEditError(null);

    try {
      await onUpdateUser(editingUserId, {
        role: editedRole,
        active: editedActive,
      });
      closeEditModal();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Falha ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (userId: string, userName: string) => {
    setDeleteModalVisible(true);
    setDeletingUserId(userId);
    setDeletingUserName(userName);
  };

  const confirmDelete = async () => {
    if (!deletingUserId || !onDeleteUser) return;
    
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await onDeleteUser(deletingUserId);
      closeDeleteModal();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Falha ao excluir usuário');
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalVisible(false);
    setDeletingUserId(null);
    setDeletingUserName('');
    setDeleteError(null);
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin': return { color: theme.colors.primary, bg: theme.colors.primaryDim };
      case 'editor': return { color: theme.colors.badgeEdited, bg: 'rgba(255, 149, 0, 0.1)' };
      default: return { color: theme.colors.textSecondary, bg: 'rgba(155, 161, 166, 0.1)' };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const roleStyle = getRoleBadgeStyle(item.role);
    
    return (
      <View style={styles.row}>
        <VStack style={styles.colMain}>
          <DSText style={styles.name}>{item.name}</DSText>
          <DSText style={styles.email}>{item.email}</DSText>
        </VStack>
        
        <View style={styles.colRole}>
          <View style={[styles.badge, { backgroundColor: roleStyle.bg }]}>
            <DSText style={[styles.badgeText, { color: roleStyle.color }]}>
              {roles.find(r => r.value === item.role)?.label}
            </DSText>
          </View>
        </View>

        <View style={styles.colStatus}>
          <View style={[styles.statusBadge, { backgroundColor: item.active ? theme.colors.successBg : 'rgba(255, 59, 48, 0.1)' }]}>
            <View style={[styles.statusDot, { backgroundColor: item.active ? theme.colors.success : theme.colors.error }]} />
            <DSText style={[styles.statusText, { color: item.active ? theme.colors.success : theme.colors.error }]}>
              {item.active ? 'Ativo' : 'Suspenso'}
            </DSText>
          </View>
        </View>
        
        <VStack style={styles.colLastSeen}>
          <DSText style={styles.lastSeenLabel}>Último acesso</DSText>
          <DSText style={styles.lastSeenValue}>
            {(() => {
              if (!item.last_seen) return 'Nunca';
              const date = new Date(item.last_seen);
              return isNaN(date.getTime()) ? 'Data Inválida' : date.toLocaleDateString();
            })()}
          </DSText>
        </VStack>
        
        <View style={styles.colActions}>
          <TouchableOpacity
            onPress={() => openEditModal(item)}
            style={styles.iconBtn}
          >
            <FontAwesome5 name="pen" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          {currentUserId !== item.id && (
            <TouchableOpacity
              onPress={() => handleDelete(item.id, item.name)}
              style={styles.iconBtn}
            >
              <FontAwesome5 name="trash-alt" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tableHeader}>
        <DSText style={[styles.headerLabel, styles.colMain]}>Usuário</DSText>
        <DSText style={[styles.headerLabel, styles.colRole]}>Nível</DSText>
        <DSText style={[styles.headerLabel, styles.colStatus]}>Status</DSText>
        <DSText style={[styles.headerLabel, styles.colLastSeen]}>Acesso</DSText>
        <DSText style={[styles.headerLabel, styles.colActions]}></DSText>
      </View>

      {users.length > 0 ? (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || false}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
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
        onRequestClose={closeEditModal}
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
              <DSText style={styles.label}>Nível de acesso</DSText>
              <HStack style={styles.roleToggleGroup}>
                {roles.map(r => (
                  <Button
                    key={r.value}
                    title={r.label}
                    variant={editedRole === r.value ? 'primary' : 'secondary'}
                    onPress={() => setEditedRole(r.value)}
                    style={styles.roleToggleBtn}
                    size="sm"
                  />
                ))}
              </HStack>
              
              <HStack style={styles.statusField}>
                <VStack style={{ flex: 1 }}>
                  <DSText style={styles.label}>Status da conta</DSText>
                  <DSText style={styles.helperText}>
                    {editedActive ? 'O usuário pode acessar o sistema' : 'O usuário está impedido de fazer login'}
                  </DSText>
                </VStack>
                <Switch
                  value={editedActive}
                  onValueChange={setEditedActive}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </HStack>
            </VStack>
            
            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                variant="secondary"
                onPress={closeEditModal}
                style={styles.cancelButton}
              />
              <Button
                title="Salvar Alterações"
                onPress={handleSave}
                loading={isSaving}
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <DSText style={styles.modalTitle}>Confirmar Exclusão</DSText>
            
            <DSText style={styles.deleteMessage}>
              Tem certeza que deseja excluir o usuário {deletingUserName}?{'\n'}
              Esta ação não pode ser desfeita.
            </DSText>
            
            {deleteError && (
              <View style={styles.errorBox}>
                <DSText style={styles.errorText}>{deleteError}</DSText>
              </View>
            )}
            
            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                variant="secondary"
                onPress={closeDeleteModal}
                style={styles.cancelButton}
              />
              <Button
                title="Excluir"
                onPress={confirmDelete}
                loading={isDeleting}
                style={styles.deleteButton}
                icon={<FontAwesome5 name="trash" size={16} color={theme.colors.white} />}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Remove custom RefreshControl mock as we use the native one

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.input,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  headerLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  colMain: { flex: 3 },
  colRole: { flex: 1.5, alignItems: 'flex-start' },
  colStatus: { flex: 1.5, alignItems: 'flex-start' },
  colLastSeen: { flex: 2 },
  colActions: { flex: 1, alignItems: 'flex-end', flexDirection: 'row', gap: theme.spacing.sm },
  iconBtn: {
    padding: 8,
    backgroundColor: theme.colors.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  
  name: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  email: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.roundness.full,
  },
  badgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.roundness.full,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  lastSeenLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  lastSeenValue: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  empty: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    padding: theme.spacing.xl,
    width: '90%',
    maxWidth: 450,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
      textAlign: 'center',
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.lg,
    color: theme.colors.text,
  },
  modalForm: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  helperText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  roleToggleGroup: {
    gap: theme.spacing.xs,
  },
  roleToggleBtn: {
    flex: 1,
  },
  statusField: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
  },
  cancelButton: {
    minWidth: 100,
  },
  saveButton: {
    minWidth: 140,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    borderRadius: theme.roundness.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: theme.typography.sizes.sm,
  },
  deleteMessage: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    minWidth: 100,
  },
});