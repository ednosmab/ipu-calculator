import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

type Props = {
  result: number;
  style?: StyleProp<ViewStyle>;
};

export const ResultCard = ({ result, style }: Props) => (
  <View style={[styles.container, style]}>
    <Text variant="label" style={styles.label}>Valor Calculado</Text>
    <Text style={styles.value}>{result.toFixed(3)}</Text>
    <Text style={styles.unit}>unidades</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.successBg,
    borderRadius: theme.roundness.lg,
    padding: theme.spacing.xl,
    borderWidth: theme.borderWidth.thick,
    borderColor: theme.colors.success,
    alignItems: 'center',
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 36,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
    marginTop: theme.spacing.xs,
  },
  unit: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});