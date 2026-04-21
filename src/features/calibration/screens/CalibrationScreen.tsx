import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View, Switch } from 'react-native';
import { Button } from '../../../components/Button';
import { InputField } from '../../../components/InputField';
import { ResultCard } from '../../../components/ResultCard';
import { ScreenLayout } from '../../../components/ScreenLayout';
import { theme } from '../../../styles/theme';
import { useCalibration } from '../hooks/useCalibration';
import { styles } from './CalibrationScreen.styles';

type Props = {
  goBack: () => void;
  goToCalculator: () => void;
};

export const CalibrationScreen = ({ goBack, goToCalculator }: Props) => {
  const {
    targetWeight,
    machineValue,
    actualWeight,
    extractedWeight,
    averageValue,
    isHelperActive,
    setTargetWeight,
    setMachineValue,
    setActualWeight,
    setExtractedWeight,
    setAverageValue,
    setIsHelperActive,
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
            icon={<Ionicons name="arrow-back" size={20} color={theme.colors.black} />}
            style={{ flex: 1, marginRight: theme.spacing.sm }}
          />
          <Button
            title="Calculadora IPU"
            onPress={goToCalculator}
            style={{ flex: 1, marginLeft: theme.spacing.sm }}
          />
        </>
      }
    >
      {result !== null && <ResultCard result={result} />}

      <View style={styles.helperContainer}>
        <Text style={styles.helperText}>Assistente de Peso Real</Text>
        <Switch
          value={isHelperActive}
          onValueChange={setIsHelperActive}
          trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
          thumbColor={theme.colors.white}
        />
      </View>

      {isHelperActive && (
        <View style={{ marginBottom: theme.spacing.md }}>
          <InputField
            label="Peso extraído"
            value={extractedWeight}
            onChange={setExtractedWeight}
          />
          <InputField
            label="Valor Média"
            value={averageValue}
            onChange={setAverageValue}
          />
        </View>
      )}

      <InputField
        label="Peso desejado"
        value={targetWeight}
        onChange={setTargetWeight}
      />

      <InputField
        label="Valor da máquina"
        value={machineValue}
        onChange={setMachineValue}
      />

      <InputField
        label="Peso real"
        value={actualWeight}
        onChange={setActualWeight}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.buttonGroup}>
        <Button title="Calcular" onPress={calculate} />
        <View style={styles.spacer} />
        <Button title="Limpar" onPress={clear} />
      </View>
    </ScreenLayout>
  );
};