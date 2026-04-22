import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../styles/theme';

type Props = {
  result: string;
};

export const ResultCard = ({ result }: Props) => (
  <View style={styles.card}>
    <Text style={styles.label}>Resultado</Text>
    <View style={styles.valueContainer}>
      <Text style={styles.value}>{result}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(148, 166, 132, 0.08)', // Tinted with Success (Sage)
    padding: 20,
    borderRadius: theme.roundness.md,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  label: {
    color: theme.colors.textSecondary,
    marginBottom: 4,
    fontSize: theme.typography.sizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valueContainer: {
    marginTop: 4,
  },
  value: {
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.bold as any,
  }
});