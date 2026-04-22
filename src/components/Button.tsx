import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { theme } from '../styles/theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const Button = ({ title, onPress, variant = 'primary', icon, style }: Props) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.secondary : styles.primary,
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.text,
          variant === 'secondary' ? styles.textSecondary : styles.textPrimary,
          icon ? { marginLeft: 8 } : {},
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderRadius: theme.roundness.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
  },
  text: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
  },
  textPrimary: {
    color: '#0F1115',
  },
  textSecondary: {
    color: theme.colors.text,
  },
});