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
    fontSize: 28,
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
