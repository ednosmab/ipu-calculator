import { StyleSheet } from 'react-native';
import { theme } from '@/design-system';

export const styles = StyleSheet.create({
  error: {
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    fontSize: theme.typography.sizes.sm,
  },
  buttonGroup: {
    marginTop: theme.spacing.sm,
  },
  spacer: {
    height: theme.spacing.sm,
  },
  helperCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  helperText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  }
});
