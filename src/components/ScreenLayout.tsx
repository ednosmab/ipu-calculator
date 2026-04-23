import React, { ReactNode, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/design-system';
import { Title } from '@/components/Title';

export type ScreenLayoutRef = {
  scrollToTop: () => void;
};

type Props = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  centered?: boolean;
  scrollable?: boolean;
};

const ScreenLayout = forwardRef<ScreenLayoutRef, Props>(
  function ScreenLayout({ title, children, footer, centered = false, scrollable = true }, ref) {
    const scrollViewRef = useRef<ScrollView>(null);

    useImperativeHandle(ref, useCallback(() => ({
      scrollToTop: () => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      },
    }), []));

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.innerContainer}>
          <Title>{title}</Title>
          {scrollable ? (
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1 }}
              contentContainerStyle={centered ? styles.centered : styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.viewContent, centered && styles.centered]}>
              {children}
            </View>
          )}
          {footer && (
            <View style={styles.bottomMenu}>
              {footer}
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }
);

ScreenLayout.displayName = 'ScreenLayout';

export { ScreenLayout };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingBottom: theme.spacing.lg,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  viewContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  centered: {
    justifyContent: 'center',
  },
  bottomMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
});