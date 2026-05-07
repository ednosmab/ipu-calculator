// src/components/admin/TopModelsList.tsx
// Placeholder for top models list

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card } from '@/design-system';
import { theme } from '@/design-system';

interface ModelItem {
  modelId: string;
  name: string;
  uses: number;
}

interface Props {
  models: ModelItem[];
  title: string;
}

export const TopModelsList = ({ models, title }: Props) => {
  if (!models || models.length === 0) {
    return (
      <Card>
        <Text style={styles.placeholder}>Nenhum dado de modelos disponível</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.listContainer}>
        <FlatList
          data={models}
          keyExtractor={item => item.modelId}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.position}>{models.indexOf(item) + 1}.</Text>
              <View style={styles.info}>
                <Text style={styles.modelName}>{item.name}</Text>
                <Text style={styles.uses}>{item.uses} usos</Text>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.sm,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  position: {
    width: 24,
    textAlign: 'center',
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
  info: {
    flex: 1,
  },
  modelName: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  uses: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
  },
});