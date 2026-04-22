import React from 'react';
import { Text as RNText, StyleSheet, TextProps } from 'react-native';
import { theme } from '../theme';

type Props = TextProps & {
  children: string;
};

export const Title = ({ children, style, ...props }: Props) => (
  <RNText style={[styles.title, style]} {...props}>
    {children}
  </RNText>
);

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
});