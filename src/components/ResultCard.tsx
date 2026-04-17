import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../styles/theme';
import { formatNumber } from '../utils/format';

type Props = {
  result: number;
};

export const ResultCard = ({ result }: Props) => (
  <View style={styles.card}>
    <Text style={styles.label}>Resultado</Text>
    <Text style={styles.value}>{formatNumber(result)}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 16,
    marginTop: 16
  },
  label: {
    color: theme.colors.muted,
    marginBottom: 8
  },
  value: {
    fontSize: 32,
    color: theme.colors.accent
  }
});