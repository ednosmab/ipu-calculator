import { useState } from 'react';
import { KeyboardTypeOptions, StyleSheet, TextInput, View } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

type Props = {
  label: string;
  value: string;
  onChange: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

export const Input = ({ 
  label, 
  value, 
  onChange, 
  keyboardType = "numeric",
  placeholder = "0.00",
  autoCapitalize,
  error,
  helperText
}: Props) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text variant="label" weight="medium">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.inputPlaceholder}
        autoCapitalize={autoCapitalize}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          !!error && styles.inputError
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {!!error && <Text variant="error" weight="medium">{error}</Text>}
      {!!helperText && !error && <Text variant="helper">{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.md, gap: theme.spacing.xs },
  input: {
    backgroundColor: theme.colors.input,
    borderColor: theme.colors.border,
    borderWidth: theme.borderWidth.medium,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
  },
  inputError: {
    borderColor: theme.colors.error,
  }
});