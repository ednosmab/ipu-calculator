import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { theme } from '@/design-system/theme';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const opacity = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((msg: string, t: ToastType = 'info') => {
    setMessage(msg);
    setType(t);
    setVisible(true);

    // Reset opacity
    opacity.setValue(0);

    // Fade In
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto hide after 3.5s (para dar tempo de ler + animação)
    setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, 3500);
  }, [opacity]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={styles.flex}>
        {children}
        {visible && (
          <Animated.View 
            style={[
              styles.container, 
              styles[type],
              { 
                opacity, 
                transform: [
                  { translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }
                ] 
              }
            ]}
          >
            <Text style={styles.text}>{message}</Text>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: theme.roundness.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      },
      default: {
        elevation: 10,
      }
    })
  },
  info: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  success: { backgroundColor: theme.colors.successBg, borderWidth: 1, borderColor: theme.colors.success },
  error: { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderWidth: 1, borderColor: theme.colors.error },
  warning: { backgroundColor: 'rgba(255, 149, 0, 0.1)', borderWidth: 1, borderColor: theme.colors.warning },
  text: { color: theme.colors.text, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
