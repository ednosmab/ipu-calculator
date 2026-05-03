import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: 'default' | 'success';
};

export const Card = ({ children, style, testID, variant = 'default' }: Props) => (
  <View 
    style={[
      styles.card, 
      variant === 'success' && styles.success,
      style
    ]} 
    testID={testID}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.lg,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  success: {
    backgroundColor: theme.colors.successBg,
    borderColor: theme.colors.success,
    borderWidth: theme.borderWidth.thick,
  },
});
