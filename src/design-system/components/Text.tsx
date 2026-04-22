import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { theme } from '../theme';

type Props = TextProps & {
  variant?: 'body' | 'label' | 'error' | 'helper';
  weight?: keyof typeof theme.typography.weights;
};

export const Text = ({ 
  children, 
  variant = 'body', 
  weight = 'regular', 
  style, 
  ...props 
}: Props) => {
  return (
    <RNText 
      style={[
        styles.base,
        styles[variant],
        { fontWeight: theme.typography.weights[weight] },
        style
      ]} 
      {...props}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
  },
  body: {
    fontSize: theme.typography.sizes.md,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  error: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.error,
  },
  helper: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
});
