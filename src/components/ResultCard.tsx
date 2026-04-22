import { StyleSheet, View } from 'react-native';
import { theme, Card, Text } from '@/design-system';

type Props = {
  result: string;
};

export const ResultCard = ({ result }: Props) => (
  <Card style={styles.card}>
    <Text variant="label" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Resultado</Text>
    <View style={styles.valueContainer}>
      <Text variant="body" weight="bold" style={{ fontSize: theme.typography.sizes.xl }}>{result}</Text>
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.successBg,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: theme.borderWidth.thin,
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
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.bold,
  }
});