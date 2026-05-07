// app/admin/metrics/index.tsx
// Métricas e gráficos de uso do painel admin

import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, FlatList } from 'react-native';
import { useAdminMetrics } from '@/hooks/admin/useAdminMetrics';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Button } from '@/design-system';
import { MetricCard } from '@/components/admin/MetricCard';
import { LoginChart } from '@/components/admin/LoginChart';
import { UsageBarChart } from '@/components/admin/UsageBarChart';
import { TopModelsList } from '@/components/admin/TopModelsList';
import { theme } from '@/design-system';

export default function MetricsScreen() {
  const { isAuthorized } = useRequireAuth('admin');
  const { metrics, isLoading, error, refetch } = useAdminMetrics();

  if (!isAuthorized) {
    return null;
  }
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  if (isLoading && !metrics) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loading}>Carregando métricas...</Text>
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
        <Text style={styles.title}>Métricas de Uso</Text>
        <View style={styles.actions}>
          <Button title="Atualizar" onPress={handleRefresh} />
        </View>
      </View>
      
      {metrics ? (
        <View style={styles.content}>
          {/* Cards de resumo */}
          <View style={styles.cardsContainer}>
            <MetricCard 
              title="Usuários ativos hoje" 
              value={metrics.activeUsersToday.toString()} 
              icon="users" 
              color={theme.colors.primary} 
            />
            <MetricCard 
              title="Ativos (30 dias)" 
              value={metrics.activeUsers30Days.toString()} 
              icon="users" 
              color={theme.colors.secondary} 
            />
            <MetricCard 
              title="Cálculos total" 
              value={metrics.totalCalculations.toString()} 
              icon="calculator" 
              color={theme.colors.success} 
            />
            <MetricCard 
              title="Modelos cadastrados" 
              value={metrics.totalModels.toString()} 
              icon="list" 
              color={theme.colors.warning} 
            />
          </View>
          
          {/* Gráficos */}
          <View style={styles.chartsContainer}>
            <LoginChart 
              data={metrics.loginsPerDay} 
              title="Logins por dia (últimos 30 dias)" 
            />
            <UsageBarChart 
              data={metrics.calculationsPerUser} 
              title="Cálculos por usuário (Top 10)" 
            />
            <TopModelsList 
              models={metrics.topModels} 
              title="Modelos mais acessados" 
            />
          </View>
        </View>
      ) : (
        <View style={styles.empty}>
          <Text>Nenhum dado disponível</Text>
        </View>
      )}
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
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  chartsContainer: {
    gap: theme.spacing.lg,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loading: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
});