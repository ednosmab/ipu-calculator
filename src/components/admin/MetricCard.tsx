// src/components/admin/MetricCard.tsx
// Card de resumo numérico

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HStack, VStack } from '@/design-system';
import * as FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { theme } from '@/design-system';

interface Props {
  title: string;
  value: string;
  icon: 'users' | 'calculator' | 'list' | 'chart-line' | 'chart-bar';
  color: string;
}

const iconMap: Record<string, any> = {
  users: FontAwesome5.users,
  calculator: FontAwesome5.calculator,
  list: FontAwesome5.list,
  'chart-line': FontAwesome5.chartLine,
  'chart-bar': FontAwesome5.chartBar,
};

export const MetricCard = ({ title, value, icon, color }: Props) => {
  const Icon = iconMap[icon] || FontAwesome5.circle;
  
  return (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: color }]}>
      <HStack style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon size={24} color={color} />
        </View>
        <VStack style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value}>{value}</Text>
        </VStack>
      </HStack>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.md,
    minWidth: 120,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
});