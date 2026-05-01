import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, theme } from '@/design-system';
import { CalculationModel, ModelType } from '../domain/calculationModel';
import { ModelCard } from './ModelCard';

type Props = {
  models: CalculationModel[];
  type: ModelType;
  search: string;
  onEdit: (model: CalculationModel) => void;
  onEditTime: (model: CalculationModel) => void;
  onDelete: (model: CalculationModel) => void;
  onSelect: (model: CalculationModel) => void;
};

export const ModelList = ({ models, type, search, onEdit, onEditTime, onDelete, onSelect }: Props) => {
  const filterBySearch = (modelsToFilter: CalculationModel[]) => {
    const sorted = [...modelsToFilter].sort((a, b) => a.name.localeCompare(b.name));
    if (!search.trim()) return sorted;
    const term = search.toUpperCase();
    return sorted.filter(m => m.name.toUpperCase().includes(term));
  };

  const filtered = filterBySearch(models);
  
  if (filtered.length === 0) return null;
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {type === 'ipu' ? 'Injeção' : 'Calibração'}
      </Text>
      {filtered.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          onEdit={onEdit}
          onEditTime={onEditTime}
          onDelete={onDelete}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
});