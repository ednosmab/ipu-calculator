import { useState } from 'react';
import { KeyboardTypeOptions, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../styles/theme';

type Props = {
  label: string;
  value: string;
  onChange: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
};

export const InputField = ({ label, value, onChange, keyboardType = "numeric" }: Props) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholder="0.00"
        placeholderTextColor={theme.colors.textSecondary}
        style={[
          styles.input,
          isFocused && styles.inputFocused
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { 
    color: theme.colors.textSecondary, 
    marginBottom: 8,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium as any,
  },
  input: {
    backgroundColor: theme.colors.input,
    borderColor: theme.colors.border,
    borderWidth: 1.5,
    borderRadius: theme.roundness.md,
    padding: 14,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
  }
});