import { StyleSheet, View } from 'react-native';
import { theme, Card, Text } from '@/design-system';

type Props = {
  result: string | null;
  unit?: string;
};

export const ResultCard = ({ result, unit = 'g' }: Props) => (
  <Card style={styles.card}>
    <Text variant="label" style={styles.label}>Valor Calculado</Text>
    <View style={styles.valueContainer}>
      <View style={styles.valueRow}>
        <Text variant="body" weight="bold" style={styles.value}>{result ?? '—'}</Text>
        {result !== null && <Text style={styles.unit}>{unit}</Text>}
      </View>
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.successBg,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.lg,
    marginBottom: theme.spacing.md,
    borderWidth: theme.borderWidth.thick,
    borderColor: theme.colors.success,
  },
  label: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontSize: theme.typography.sizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valueContainer: {
    marginTop: theme.spacing.sm,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 40,
    color: theme.colors.success,
    fontWeight: theme.typography.weights.bold,
    lineHeight: 44,
  },
  unit: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
});