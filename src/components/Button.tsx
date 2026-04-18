import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { theme } from '../styles/theme';

type Props = {
  title: string;
  onPress: () => void;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const Button = ({ title, onPress, icon, style }: Props) => (
  <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
    {icon}
    <Text style={[styles.text, icon ? { marginLeft: 8 } : {}]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginVertical: 12
  },
  text: {
    fontWeight: 'bold',
    color: '#000'
  }
});