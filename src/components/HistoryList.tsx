import { StyleSheet, View, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme, Text, Card, HStack } from '@/design-system';
import { CalculationHistory } from '@/features/history/domain/calculationHistory';

type Props = {
  history: CalculationHistory[];
  labels?: Record<string, string>;
  onItemPress?: (item: CalculationHistory) => void;
  onClear?: () => void;
};

export const HistoryList = ({ history, labels, onItemPress, onClear }: Props) => {
  if (history.length === 0) {
    return null;
  }

  const defaultLabels = history[0]?.type === 'ipu'
    ? { isocyanate: 'Iso', polyol: 'Pol' }
    : {
        extractedWeight: 'Peso extraído',
        averageValue: 'Valor média',
        targetWeight: 'Peso desejado',
        machineValue: 'Valor máquina',
        actualWeight: 'Peso real',
      };

  const displayLabels: Record<string, string> = (labels ?? defaultLabels) as Record<string, string>;

  const formatInputs = (inputs: Record<string, number>) => {
    const keys = Object.keys(inputs);
    if (keys.length === 2) {
      const key1 = keys[0];
      const key2 = keys[1];
      const label1 = displayLabels[key1] ?? key1;
      const label2 = displayLabels[key2] ?? key2;
      return `${label1} ${inputs[key1]} • ${label2} ${inputs[key2]}`;
    }
    if (keys.length === 5) {
      const pe = inputs.extractedWeight;
      const vm = inputs.averageValue;
      const hasHelper = pe > 0 && vm > 0;
      
      const parts: string[] = [];
      if (hasHelper) {
        parts.push(`${displayLabels.extractedWeight ?? 'PE'} ${pe} • ${displayLabels.averageValue ?? 'VM'} ${vm}`);
      }
      if (inputs.targetWeight) {
        parts.push(`${displayLabels.targetWeight ?? 'PD'} ${inputs.targetWeight}`);
      }
      if (inputs.machineValue) {
        parts.push(`${displayLabels.machineValue ?? 'VM'} ${inputs.machineValue}`);
      }
      if (inputs.actualWeight) {
        parts.push(`${displayLabels.actualWeight ?? 'PR'} ${inputs.actualWeight}`);
      }
      return parts.join(' • ');
    }
    return '';
  };

  return (
    <View style={styles.container}>
      <HStack style={styles.header}>
        <Text style={styles.title}>CÁLCULOS RECENTES</Text>
        {onClear && (
          <Pressable onPress={onClear}>
            <HStack gap="xs">
              <FontAwesome5 name="eraser" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.clearBtn}>Limpar</Text>
            </HStack>
          </Pressable>
        )}
      </HStack>
      
      {history.slice(0, 10).map((item) => (
        <Pressable key={item.id} onPress={() => onItemPress?.(item)}>
          <Card style={styles.item}>
            <View style={styles.row}>
              <View style={styles.inputs}>
                <Text style={styles.inputText}>
                  {formatInputs(item.inputs)}
                </Text>
              </View>
              <Text style={styles.result}>{item.result.toFixed(4)}</Text>
            </View>
          </Card>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.lg,
  },
  header: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clearBtn: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  item: {
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputs: {
    flex: 1,
  },
  inputText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  result: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    marginLeft: theme.spacing.sm,
  },
});