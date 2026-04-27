/**
 * Design System tokens and theme configuration.
 */
export type FontWeight = '400' | '500' | '600' | '700';

export const theme = {
  colors: {
    bg: '#0B0C0F',
    surface: '#121418',
    input: '#1C1F26',
    primary: '#00F5D4',
    primaryDim: 'rgba(0, 245, 212, 0.1)',
    primaryDark: '#00B89C',
    success: '#00F5D4',
    text: '#FFFFFF',
    textSecondary: '#9BA1A6',
    primaryText: '#000000',
    successBg: 'rgba(0, 245, 212, 0.1)',
    inputPlaceholder: '#9BA1A6',
    border: '#2C3036',
    error: '#FF3B30',
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
