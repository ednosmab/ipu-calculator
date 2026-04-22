import React from 'react';
import { StyleSheet, TextProps } from 'react-native';
import { theme, Text } from '@/design-system';

export const Title = ({ children, style, ...props }: TextProps) => {
  return (
    <Text weight="bold" style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    fontWeight: theme.typography.weights.bold,
  },
});
