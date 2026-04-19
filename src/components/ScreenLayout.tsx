import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import { Title } from './Title';

type Props = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export const ScreenLayout = ({ title, children, footer }: Props) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Title>{title}</Title>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
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
    paddingBottom: 20,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  bottomMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
