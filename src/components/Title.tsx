import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { theme } from '../styles/theme';

export const Title = ({ children, style, ...props }: TextProps) => {
  return (
    <Text style={[styles.title, style]} {...props}>
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
    fontWeight: theme.typography.weights.bold as any,
  },
});
