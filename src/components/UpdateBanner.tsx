import { Text, theme } from '@/design-system';
import { useTranslation } from '@/i18n/TranslationContext';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

type Props = {
  onRefresh: () => void;
  onDismiss: () => void;
};

export const UpdateBanner = ({ onRefresh, onDismiss }: Props) => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss();
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        delay: 150,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  if (dismissed) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.touchableArea}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Text style={styles.title} numberOfLines={1}>
            {t('newVersionAvailable') || 'Nova versão disponível. Toque para atualizar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          activeOpacity={0.6}
        >
          <Text style={styles.dismissIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: -25,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: Platform.OS === 'ios' ? 44 : 36,
  },
  container: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    borderWidth: theme.borderWidth.medium,
    borderColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  touchableArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: theme.roundness.lg,
    backgroundColor: `${theme.colors.white}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    alignSelf: 'center',
  },
  dismissIcon: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
});
