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
    <Text variant="label">Resultado</Text>
    <Text style={styles.value}>{result.toFixed(2)}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.successBg,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.lg,
    borderWidth: theme.borderWidth.medium,
    borderColor: theme.colors.success,
    alignItems: 'center',
  },
  value: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
    marginTop: theme.spacing.xs,
  },
});