import React from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { Title } from './Title';

type Props = {
  title: string;
  rightElement?: React.ReactNode;
};

export const Header = ({ title, rightElement }: Props) => (
  <View style={styles.container}>
    <View style={styles.placeholder} />
    <Title>{title}</Title>
    <View style={styles.right}>
      {rightElement}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  placeholder: {
    width: 60,
  },
  right: {
    width: 60,
    alignItems: 'flex-end',
  },
});