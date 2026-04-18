import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { ResultCard } from '../components/ResultCard';
import { useCalculator } from '../hooks/useCalculator';
import { theme } from '../styles/theme';

type Props = {
  goBack: () => void;
  goToCalibration: () => void;
};

export const CalculatorScreen = ({ goBack, goToCalibration }: Props) => {
  const { iso, poliol, setIso, setPoliol, result, error, calculate, clear } = useCalculator();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calculadora IPU</Text>

      <View style={styles.content}>
        {result !== null && <ResultCard result={result} />}

        <InputField
          label="Iso"
          value={iso}
          onChange={setIso}
          keyboardType="numeric"
        />
        <InputField
          label="Poliol"
          value={poliol}
          onChange={setPoliol}
          keyboardType="numeric"
        />

        {error && <Text style={styles.error}>Valores inválidos</Text>}

        <View style={styles.buttonGroup}>
          <Button title="Calcular" onPress={calculate} />
          <View style={{ height: 12 }} />
          <Button title="Limpar" onPress={clear} />
        </View>
      </View>

      <View style={styles.bottomMenu}>
        <Button 
          title="Voltar" 
          onPress={goBack} 
          icon={<Ionicons name="arrow-back" size={20} color="#000" />}
          style={{ flex: 1, marginRight: 8 }}
        />
        <Button 
          title="Calibrar Vazão" 
          onPress={goToCalibration} 
          style={{ flex: 1, marginLeft: 8 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: 20,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    color: theme.colors.text,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  error: {
    color: theme.colors.error,
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonGroup: {
    marginTop: 8,
  },
});