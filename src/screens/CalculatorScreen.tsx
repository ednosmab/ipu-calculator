import { View, Text, StyleSheet } from 'react-native';
import { useCalculator } from '../hooks/useCalculator';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { ResultCard } from '../components/ResultCard';
import { theme } from '../styles/theme';

export const CalculatorScreen = () => {
  const { iso, poliol, setIso, setPoliol, result, error, calculate } = useCalculator();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calculadora IPU</Text>

      <InputField label="Iso" value={iso} onChange={setIso} />
      <InputField label="Poliol" value={poliol} onChange={setPoliol} />

      {error && <Text style={styles.error}>Valores inválidos</Text>}

      <Button title="Calcular" onPress={calculate} />

      {result !== null && <ResultCard result={result} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, color: theme.colors.text, marginBottom: 24, fontWeight: 'bold' },
  error: { color: theme.colors.error }
});
