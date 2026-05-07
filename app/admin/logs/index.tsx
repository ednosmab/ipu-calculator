// app/admin/logs/index.tsx
// Logs de acesso do painel admin

import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, FlatList } from 'react-native';
import { useAdminLogs } from '@/hooks/admin/useAdminLogs';
import { Button } from '@/design-system';
import { LogTable } from '@/components/admin/LogTable';
import { LogFilters } from '@/components/admin/LogFilters';
import { ExportCsvButton } from '@/components/admin/ExportCsvButton';
import { theme } from '@/design-system';

export default function LogsScreen() {
  const { logs, total, page, setPage, isLoading, error, refetch } = useAdminLogs();
  const [filters, setFilters] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  };

  const handleRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  if (isLoading && logs.length === 0 && total === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loading}>Carregando logs...</Text>
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
        <Text style={styles.title}>Logs de Acesso</Text>
        <View style={styles.actions}>
          <ExportCsvButton filters={filters} />
        </View>
      </View>
      
      <LogFilters
        filters={filters}
        onChange={handleFiltersChange}
      />
      
      <View style={styles.content}>
        {logs.length > 0 ? (
          <LogTable 
            logs={logs} 
            onRefresh={handleRefresh}
            refreshing={refreshing}
            total={total}
            page={page}
            onPageChange={setPage}
          />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum log encontrado</Text>
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