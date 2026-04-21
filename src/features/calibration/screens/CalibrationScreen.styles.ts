import { StyleSheet } from 'react-native';
import { theme } from '../../../styles/theme';

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
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  helperText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  }
});
