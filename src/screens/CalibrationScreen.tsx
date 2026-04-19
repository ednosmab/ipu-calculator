import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { ResultCard } from '../components/ResultCard';
import { ScreenLayout } from '../components/ScreenLayout';
import { useCalibration } from '../hooks/useCalibration';
import { theme } from '../styles/theme';

type Props = {
  goBack: () => void;
  goToCalculator: () => void;
};

export const CalibrationScreen = ({ goBack, goToCalculator }: Props) => {
  const {
    pesoDesejado,
    valorMaquina,
    pesoReal,
    setPesoDesejado,
    setValorMaquina,
    setPesoReal,
    result,
    error,
    calculate,
    clear,
  } = useCalibration();

  return (
    <ScreenLayout
      title="Calibragem de Vazão"
      footer={
        <>
          <Button
            title="Voltar"
            onPress={goBack}
            icon={<Ionicons name="arrow-back" size={20} color="#000" />}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            title="Calculadora IPU"
            onPress={goToCalculator}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </>
      }
    >
      {result !== null && <ResultCard result={result} />}

      <InputField
        label="Peso desejado"
        value={pesoDesejado}
        onChange={setPesoDesejado}
      />

      <InputField
        label="Valor da máquina"
        value={valorMaquina}
        onChange={setValorMaquina}
      />

      <InputField
        label="Peso real"
        value={pesoReal}
        onChange={setPesoReal}
      />

      {error && <Text style={styles.error}>Valores inválidos</Text>}

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
  },
  buttonGroup: {
    marginTop: 8,
  },
});