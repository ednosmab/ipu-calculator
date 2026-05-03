import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '@/design-system';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
}

export const Toast = ({ message, type }: ToastProps) => {
  const icons = {
    success: { name: 'check-circle', color: theme.colors.success },
    error: { name: 'exclamation-circle', color: theme.colors.error },
    info: { name: 'info-circle', color: theme.colors.primary },
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <FontAwesome5 name={icons[type].name} size={20} color={icons[type].color} style={styles.icon} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  message: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    flex: 1,
  },
});