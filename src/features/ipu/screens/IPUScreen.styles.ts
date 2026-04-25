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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  modalText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
});
