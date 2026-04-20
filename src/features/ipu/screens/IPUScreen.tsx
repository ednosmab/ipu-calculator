import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { InputField } from '../../../components/InputField';
import { ResultCard } from '../../../components/ResultCard';
import { ScreenLayout } from '../../../components/ScreenLayout';
import { useIPUCalculator } from '../hooks/useIPUCalculator';
import { theme } from '../../../styles/theme';

type Props = {
  goBack: () => void;
  goToCalibration: () => void;
};

export const IPUScreen = ({ goBack, goToCalibration }: Props) => {
  const { iso, poliol, setIso, setPoliol, result, error, calculate, clear } = useIPUCalculator();

  return (
    <ScreenLayout
      title="Calculadora IPU"
      footer={
        <>
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
        </>
      }
    >
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

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.buttonGroup}>
        <Button title="Calcular" onPress={calculate} />
        <View style={{ height: 12 }} />
        <Button title="Limpar" onPress={clear} />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  error: {
    color: theme.colors.error,
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonGroup: {
    marginTop: 8,
  },
});