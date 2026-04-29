import React from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '@/design-system';

export const LoadingSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={styles.skeletonHeader} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.lg,
  },
  skeletonHeader: {
    height: 40,
    width: '60%',
    backgroundColor: theme.colors.input,
    borderRadius: theme.roundness.sm,
    opacity: 0.3,
    marginBottom: theme.spacing.xl,
  },
  skeletonContent: {
    gap: theme.spacing.md,
  },
  skeletonCard: {
    height: 100,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    opacity: 0.3,
  },
});