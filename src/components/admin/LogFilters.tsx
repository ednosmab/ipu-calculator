// src/components/admin/LogFilters.tsx
// Filtros para logs de acesso

import React from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Switch } from 'react-native';
import { HStack, VStack, Button, Text as DSText, Input } from '@/design-system';
import { theme } from '@/design-system';

interface Props {
  filters: {
    userId?: string;
    actions?: string[];
    startDate?: string;
    endDate?: string;
    platform?: string;
  };
  onChange: (filters: any) => void;
}

// Mock data for filter options - in a real app these would come from API
const mockUsers = [
  { id: '1', name: 'João Silva' },
  { id: '2', name: 'Maria Santos' },
  { id: '3', name: 'Pedro Oliveira' },
];

const mockActions = [
  'login',
  'logout',
  'login_failed',
  'model_create',
  'model_edit',
  'model_delete',
  'user_suspended',
  'role_changed',
  'admin_access',
];

const mockPlatforms = [
  { label: 'Web', value: 'web' },
  { label: 'iOS', value: 'ios' },
  { label: 'Android', value: 'android' },
  { label: 'Native', value: 'native' },
];

export const LogFilters = ({ filters, onChange }: Props) => {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [filterState, setFilterState] = React.useState({
    userId: filters.userId || '',
    actions: filters.actions || [],
    startDate: filters.startDate || '',
    endDate: filters.endDate || '',
    platform: filters.platform || '',
  });

  const actionsOptions = mockActions.map(action => ({
    label: action,
    value: action,
  }));

  const platformsOptions = mockPlatforms;

  const handleApplyFilters = () => {
    const newFilters: any = {};
    if (filterState.userId) newFilters.userId = filterState.userId;
    if (filterState.actions.length > 0) newFilters.actions = filterState.actions;
    if (filterState.startDate) newFilters.startDate = filterState.startDate;
    if (filterState.endDate) newFilters.endDate = filterState.endDate;
    if (filterState.platform) newFilters.platform = filterState.platform;
    
    onChange(newFilters);
    setModalVisible(false);
  };

  const handleResetFilters = () => {
    setFilterState({
      userId: '',
      actions: [],
      startDate: '',
      endDate: '',
      platform: '',
    });
    onChange({});
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Button
        title="Filtrar"
        onPress={() => setModalVisible(true)}
        style={styles.filterButton}
      />
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <DSText style={styles.modalTitle}>Filtros de Logs</DSText>
            
            <VStack style={styles.form}>
              {/* User filter */}
              <DSText style={styles.label}>Usuário</DSText>
              <Input
                value={filterState.userId}
                onChangeText={text => setFilterState(prev => ({ ...prev, userId: text }))}
                placeholder="ID do usuário (opcional)"
              />
              
              {/* Actions filter */}
              <DSText style={styles.label}>Ações</DSText>
              <View style={styles.actionsContainer}>
                {actionsOptions.map(action => (
                  <View key={action.value} style={styles.actionOption}>
                    <Switch
                      value={filterState.actions.includes(action.value)}
                      onValueChange={value => {
                        setFilterState(prev => {
                          const actions = value 
                            ? [...prev.actions, action.value] 
                            : prev.actions.filter(a => a !== action.value);
                          return { ...prev, actions };
                        });
                      }}
                    />
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </View>
                ))}
              </View>
              
              {/* Date filters */}
              <DSText style={styles.label}>Período</DSText>
              <HStack style={styles.dateInputs}>
                <Input
                  value={filterState.startDate}
                  onChangeText={text => setFilterState(prev => ({ ...prev, startDate: text }))}
                  placeholder="DD/MM/AAAA"
                  style={styles.dateInput}
                />
                <Text style={styles.dateSeparator}>a</Text>
                <Input
                  value={filterState.endDate}
                  onChangeText={text => setFilterState(prev => ({ ...prev, endDate: text }))}
                  placeholder="DD/MM/AAAA"
                  style={styles.dateInput}
                />
              </HStack>
              
              {/* Platform filter */}
              <DSText style={styles.label}>Plataforma</DSText>
              <View style={styles.platformsContainer}>
                {platformsOptions.map(platform => (
                  <View key={platform.value} style={styles.platformOption}>
                    <Switch
                      value={filterState.platform === platform.value}
                      onValueChange={value => {
                        setFilterState(prev => ({
                          ...prev,
                          platform: value ? platform.value : '',
                        }));
                      }}
                    />
                    <Text style={styles.platformLabel}>{platform.label}</Text>
                  </View>
                ))}
              </View>
            </VStack>
            
            <View style={styles.modalActions}>
              <Button
                title="Limpar"
                onPress={handleResetFilters}
                style={styles.resetButton}
              />
              <Button
                title="Aplicar"
                onPress={handleApplyFilters}
                style={styles.applyButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.sm,
  },
  filterButton: {
    backgroundColor: theme.colors.secondary,
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
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.md,
  },
  form: {
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  actionsContainer: {
    gap: theme.spacing.xs,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLabel: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.sizes.sm,
  },
  dateInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dateInput: {
    flex: 1,
  },
  dateSeparator: {
    paddingHorizontal: theme.spacing.xs,
    color: theme.colors.text,
  },
  platformsContainer: {
    gap: theme.spacing.xs,
  },
  platformOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformLabel: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.sizes.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  resetButton: {
    backgroundColor: theme.colors.border,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
  },
});