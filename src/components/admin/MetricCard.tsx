// src/components/admin/MetricCard.tsx
// Card de resumo numérico

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HStack, VStack, theme } from '@/design-system';
import {
  FaUsers,
  FaCalculator,
  FaList,
  FaChartLine,
  FaChartBar,
  FaCircle,
} from '@expo/vector-icons/FontAwesome5';

type IconName = 'users' | 'calculator' | 'list' | 'chart-line' | 'chart-bar';

interface Props {
  title: string;
  value: string;
  icon: IconName;
  color: string;
}

const iconMap: Record<IconName, React.ComponentType<any>> = {
  users: FaUsers,
  calculator: FaCalculator,
  list: FaList,
  'chart-line': FaChartLine,
  'chart-bar': FaChartBar,
};

export const MetricCard = ({ title, value, icon, color }: Props) => {
  const IconComponent = iconMap[icon] || FaCircle;
  
  return (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: color }]}>
      <HStack style={styles.content}>
        <View style={styles.iconContainer}>
          <IconComponent size={24} color={color} />
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
    fontSize: theme.typography.sizes.xl,
      textAlign: 'center',
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
});