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
  rightHeader?: ReactNode;
};

const ScreenLayout = forwardRef<ScreenLayoutRef, Props>(function ScreenLayout(
  { title, children, footer, centered = false, scrollable = true, rightHeader },
  ref
) {
  const scrollViewRef = useRef<ScrollView>(null);

  useImperativeHandle(ref, useCallback(() => ({
    scrollToTop: () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    },
  }), []));

  const ContentWrapper = scrollable ? ScrollView : View;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <View style={styles.headerPlaceholder} />
          <Title>{title}</Title>
          <View style={styles.headerRight}>
            {rightHeader}
          </View>
        </View>
        <ContentWrapper
          ref={scrollable ? scrollViewRef : null}
          style={!scrollable && { flex: 1 }}
          contentContainerStyle={scrollable ? [
            styles.scrollContent,
            centered && styles.centered
          ] : undefined}
          showsVerticalScrollIndicator={false}
        >
          <View style={[
            !scrollable && styles.viewContent,
            !scrollable && centered && styles.centered
          ]}>
            {children}
          </View>
        </ContentWrapper>
        {footer && (
          <View style={styles.bottomMenu}>
            {footer}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
});

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  headerPlaceholder: {
    width: 60,
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
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