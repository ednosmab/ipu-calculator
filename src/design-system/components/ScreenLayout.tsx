import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../theme';
import { Title } from './Title';
import { VStack } from './VStack';

type Props = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  centered?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const ScreenLayout = ({ title, children, footer, centered, style }: Props) => (
  <View style={[styles.container, style]}>
    <VStack gap="lg" style={[styles.content, centered && { alignItems: 'center' }]}>
      <Title>{title}</Title>
      <View style={styles.body}>{children}</View>
    </VStack>
    {footer && <View style={styles.footer}>{footer}</View>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.lg,
  },
  content: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  footer: {
    paddingTop: theme.spacing.lg,
  },
});