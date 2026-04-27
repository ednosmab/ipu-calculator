import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { theme } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  icon, 
  style 
}: Props) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={title}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        styles[size],
        variant === 'secondary' ? styles.secondary : styles.primary,
        disabled && styles.disabled,
        pressed && !disabled && { transform: [{ scale: 0.97 }], opacity: 0.9 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? theme.colors.primaryText : theme.colors.primary} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              styles[`text_${size}` as keyof typeof styles],
              variant === 'secondary' ? styles.textSecondary : styles.textPrimary,
              icon ? { marginLeft: theme.spacing.sm } : {},
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.roundness.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginVertical: theme.spacing.sm,
    borderWidth: theme.borderWidth.thin,
    borderColor: 'transparent',
  },
  sm: { padding: theme.spacing.buttonSm },
  md: { padding: theme.spacing.buttonMd },
  lg: { padding: theme.spacing.buttonLg },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: theme.typography.weights.semibold,
  },
  text_sm: { fontSize: theme.typography.sizes.sm },
  text_md: { fontSize: theme.typography.sizes.md },
  text_lg: { fontSize: theme.typography.sizes.lg },
  textPrimary: {
    color: theme.colors.primaryText,
  },
  textSecondary: {
    color: theme.colors.text,
  },
});