import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/design-system';
import { Title } from '@/components/Title';

type Props = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  centered?: boolean;
  scrollable?: boolean;
};

export const ScreenLayout = ({ 
  title, 
  children, 
  footer, 
  centered = false, 
  scrollable = true 
}: Props) => {
  const ContentWrapper = scrollable ? ScrollView : View;
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Title>{title}</Title>
        <ContentWrapper
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
};

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
