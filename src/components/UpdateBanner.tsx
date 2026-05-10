import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Text, theme } from '@/design-system';
import { FontAwesome5 } from '@expo/vector-icons';

interface UpdateBannerProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({ onUpdate, onDismiss }) => {
  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <FontAwesome5 name="rocket" size={16} color={theme.colors.primary} style={styles.icon} />
        <Text style={styles.message}>
          Nova versão disponível!
        </Text>
        <Pressable 
          onPress={onUpdate} 
          style={({ pressed }) => [
            styles.updateButton,
            pressed && { opacity: 0.8 }
          ]}
        >
          <Text style={styles.updateText}>Atualizar</Text>
        </Pressable>
        <Pressable onPress={onDismiss} style={styles.dismissButton}>
          <FontAwesome5 name="times" size={14} color={theme.colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 10000,
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#1E2128',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    maxWidth: 500,
    width: '100%',
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  updateText: {
    color: theme.colors.primaryText,
    fontSize: 13,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
});
