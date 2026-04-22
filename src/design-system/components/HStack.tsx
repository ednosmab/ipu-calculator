import React, { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { theme } from '../theme';

type Props = {
  children: ReactNode;
  gap?: keyof typeof theme.spacing;
  style?: StyleProp<ViewStyle>;
};

export const HStack = ({ children, gap = 'sm', style }: Props) => (
  <View style={[{ flexDirection: 'row', gap: theme.spacing[gap] }, style]}>
    {children}
  </View>
);
