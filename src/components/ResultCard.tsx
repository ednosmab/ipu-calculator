import { StyleSheet, View } from 'react-native';
import { theme, Card, Text } from '@/design-system';

type Props = {
  result: string;
};

export const ResultCard = ({ result }: Props) => (
  <Card style={styles.card}>
    <Text variant="label" style={styles.label}>Valor Calculado</Text>
    <View style={styles.valueContainer}>
      <Text variant="body" weight="bold" style={styles.value}>{result}</Text>
    </View>
    <Text style={styles.unit}>unidades</Text>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.successBg,
    padding: theme.spacing.xl,
    borderRadius: theme.roundness.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
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
    marginTop: theme.spacing.xs,
  },
  value: {
    fontSize: 36,
    color: theme.colors.success,
    fontWeight: theme.typography.weights.bold,
  },
  unit: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});