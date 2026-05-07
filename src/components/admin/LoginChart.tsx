// src/components/admin/LoginChart.tsx
// Placeholder for logins per day line chart

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/design-system';
import { theme } from '@/design-system';

interface Props {
  data: Array<{ day: string; logins: number }>;
  title: string;
}

export const LoginChart = ({ data, title }: Props) => {
  // In a real implementation, we would use a charting library like react-native-chart-kit or victory-native
  // For now, we'll render a simple placeholder
  
  if (!data || data.length === 0) {
    return (
      <Card>
        <Text style={styles.placeholder}>Dados de logins não disponíveis</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        {/* In a real app, this would be a line chart */}
        <View style={styles.placeholderChart}>
          <Text style={styles.chartText}>Gráfico de Linha: Logins por Dia</Text>
          <Text style={styles.chartText}>{data.length} pontos de dados</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.sm,
  },
  chartContainer: {
    flex: 1,
    backgroundColor: theme.colors.input,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.md,
  },
  placeholderChart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
  },
});