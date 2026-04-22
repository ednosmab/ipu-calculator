import { Button, Input, Card, theme, HStack, VStack, Text } from '@/design-system';
import { ResultCard } from '@/components/ResultCard';
import { ScreenLayout } from '@/components/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { useIPUCalculator } from '../hooks/useIPUCalculator';
import { styles } from './IPUScreen.styles';

type Props = {
  goBack: () => void;
  goToCalibration: () => void;
};

export const IPUScreen = ({ goBack, goToCalibration }: Props) => {
  const { 
    isocyanate, 
    polyol, 
    setIsocyanate, 
    setPolyol, 
    result, 
    error, 
    fieldErrors,
    calculate, 
    clear 
  } = useIPUCalculator();

  return (
    <ScreenLayout
      title="Injeção"
      footer={
        <HStack>
          <Button
            title="Voltar"
            variant="secondary"
            onPress={goBack}
            icon={<Ionicons name="arrow-back" size={20} color={theme.colors.text} />}
            style={{ flex: 1 }}
          />
          <Button
            title="Calibrar Vazão"
            onPress={goToCalibration}
            style={{ flex: 1 }}
          />
        </HStack>
      }
    >
      <VStack gap="lg">
        {result !== null && <ResultCard result={result} />}

        <Card>
          <VStack>
            <Input
              label="Isocianato"
              value={isocyanate}
              onChange={setIsocyanate}
              error={fieldErrors.isocyanate ?? undefined}
              keyboardType="numeric"
            />
            <Input
              label="Poliol"
              value={polyol}
              onChange={setPolyol}
              error={fieldErrors.polyol ?? undefined}
              keyboardType="numeric"
            />
          </VStack>
        </Card>

        {error && <Text variant="error" style={styles.error}>{error}</Text>}

        <VStack gap="sm">
          <Button title="Calcular Injeção" onPress={calculate} />
          <Button title="Limpar" variant="secondary" onPress={clear} />
        </VStack>
      </VStack>
    </ScreenLayout>
  );
};