// src/components/admin/LogTable.tsx
// Tabela de logs com badge de ação

import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { HStack, VStack, Button as DSButton } from '@/design-system';
import { theme } from '@/design-system';

interface LogItem {
  id: string;
  user_id: string | null;
  action: string;
  resource: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  platform: string | null;
  created_at: string;
}

interface Props {
  logs: LogItem[];
  onRefresh?: () => void;
  refreshing?: boolean;
  total?: number;
  page?: number;
  onPageChange?: (page: number) => void;
}

// Action badge colors
const actionColors: Record<string, string> = {
  login: theme.colors.primary,
  logout: theme.colors.primary,
  login_failed: theme.colors.error,
  model_create: theme.colors.success,
  model_edit: theme.colors.success,
  model_delete: theme.colors.warning,
  user_suspended: theme.colors.error,
  role_changed: theme.colors.warning,
  admin_access: theme.colors.info,
};

const actionLabels: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  login_failed: 'Falha no login',
  model_create: 'Modelo criado',
  model_edit: 'Modelo editado',
  model_delete: 'Modelo excluído',
  user_suspended: 'Usuário suspenso',
  role_changed: 'Role alterado',
  admin_access: 'Acesso ao admin',
};

export const LogTable = ({ 
  logs, 
  onRefresh, 
  refreshing, 
  total, 
  page, 
  onPageChange 
}: Props) => {
  const renderItem = ({ item }: { item: LogItem }) => {
    const color = actionColors[item.action] || theme.colors.border;
    const label = actionLabels[item.action] || item.action;
    
    return (
      <View style={styles.row}>
        <VStack style={styles.info}>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
          {item.user_id ? (
            <Text style={styles.detail}>Usuário: {item.user_id}</Text>
          ) : (
            <Text style={styles.detail}>Usuário: Não autenticado</Text>
          )}
          <Text style={styles.detail}>IP: {item.ip || 'Desconhecido'}</Text>
          <Text style={styles.detail}>Plataforma: {item.platform || 'Desconhecido'}</Text>
        </VStack>
        
        <VStack style={styles.actions}>
          <View style={styles.badgeContainer}>
            <Text 
              style={[styles.badge, { backgroundColor: color }]}
            >
              {label}
            </Text>
          </View>
          
          <VStack style={styles.meta}>
            <Text style={styles.label}>Recurso</Text>
            <Text style={styles.value}>
              {item.resource || 'N/A'}
            </Text>
          </VStack>
        </VStack>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {logs.length > 0 ? (
        <FlatList
          data={logs}
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
          <Text>Nenhum log encontrado</Text>
        </View>
      )}
      
      {/* Pagination controls */}
      {total !== undefined && page !== undefined && onPageChange && (
        <View style={styles.pagination}>
          <Text style={styles.pageInfo}>
            {total} registros • Página {page + 1} de {Math.ceil(total / 50)}
          </Text>
          <View style={styles.paginationButtons}>
            <DSButton
              title="Anterior"
              onPress={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              size="sm"
            />
            <DSButton
              title="Próxima"
              onPress={() => onPageChange(page + 1)}
              disabled={(page + 1) * 50 >= total}
              size="sm"
            />
          </View>
        </View>
      )}
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
    alignItems: 'flex-start',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  info: {
    flex: 2,
  },
  actions: {
    flex: 1,
    alignItems: 'flex-start',
  },
  badgeContainer: {
    marginBottom: theme.spacing.xs,
  },
  badge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.roundness.sm,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: '#fff',
  },
  meta: {
    marginLeft: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    marginTop: 2,
  },
  timestamp: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  detail: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    marginTop: 2,
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
  pagination: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageInfo: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  paginationButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
});