import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { InputField } from '../../../components/InputField';
import { ResultCard } from '../../../components/ResultCard';
import { ScreenLayout } from '../../../components/ScreenLayout';
import { useIPUCalculator } from '../hooks/useIPUCalculator';
import { styles } from './IPUScreen.styles';
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
            icon={<Ionicons name="arrow-back" size={20} color={theme.colors.black} />}
            style={{ flex: 1, marginRight: theme.spacing.sm }}
          />
          <Button
            title="Calibrar Vazão"
            onPress={goToCalibration}
            style={{ flex: 1, marginLeft: theme.spacing.sm }}
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
        <View style={styles.spacer} />
        <Button title="Limpar" onPress={clear} />
      </View>
    </ScreenLayout>
  );
};