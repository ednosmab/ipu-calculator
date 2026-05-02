import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export const Card = ({ children, style, testID }: Props) => (
  <View style={[styles.card, style]} testID={testID}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.lg, // Padronizado para blocos conforme Fase 4
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
});
