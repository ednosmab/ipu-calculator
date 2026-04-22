/**
 * Design System tokens and theme configuration.
 */
export type FontWeight = '400' | '500' | '600' | '700';

export const theme = {
  colors: {
    bg: '#0F1115',
    card: '#1C1F26',
    input: '#15191F',
    primary: '#649991',
    primaryDark: '#4E7A74',
    success: '#94A684',
    text: '#C5C9D1',
    textSecondary: '#717984',
    primaryText: '#0F1115',
    successBg: 'rgba(148,166,132,0.08)',
    inputPlaceholder: '#717984',
    border: '#313943',
    error: '#E57373',
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    buttonSm: 10,
    buttonMd: 14,
    buttonLg: 18,
  },
  roundness: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },
  borderWidth: {
    thin: 1,
    medium: 1.5,
    thick: 2,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 28,
    },
    weights: {
      regular: '400' as FontWeight,
      medium: '500' as FontWeight,
      semibold: '600' as FontWeight,
      bold: '700' as FontWeight,
    }
  }
} as const;

export type Theme = typeof theme;
