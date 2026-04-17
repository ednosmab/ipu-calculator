import { View, Text, TextInput, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export const InputField = ({ label, value, onChange }: any) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      keyboardType="numeric"
      placeholder="0.00"
      placeholderTextColor={theme.colors.muted}
      style={styles.input}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { color: theme.colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    color: theme.colors.text
  }
});
