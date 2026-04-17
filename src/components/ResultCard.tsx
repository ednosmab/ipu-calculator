import { View, Text, StyleSheet } from 'react-native';
import { formatNumber } from '../utils/format';
import { theme } from '../styles/theme';

export const ResultCard = ({ result }: any) => (
  <View style={styles.card}>
    <Text>Resultado</Text>
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
  value: {
    fontSize: 32,
    color: theme.colors.accent
  }
});
