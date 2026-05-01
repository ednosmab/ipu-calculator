import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, theme } from '@/design-system';
import { useTranslation } from '@/i18n/TranslationContext';

type Props = {
  onRefresh: () => void;
  onDismiss: () => void;
};

export const UpdateBanner = ({ onRefresh, onDismiss }: Props) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity style={styles.container} onPress={onRefresh} activeOpacity={0.8}>
      <View style={styles.content}>
        <Text style={styles.text}>{t('updateAvailable')}</Text>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    zIndex: 9999,
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    color: theme.colors.bg,
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    color: theme.colors.bg,
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
  },
});