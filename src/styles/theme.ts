/**
 * Design System tokens and theme configuration.
 */
export const theme = {
  colors: {
    bg: '#0b0c0f',
    card: '#13151a',
    border: '#1f2229',
    accent: '#c8f135',
    accent2: '#4dffa3',
    text: '#e8eaf0',
    muted: '#5a5f70',
    error: '#ff8080',
    white: '#ffffff',
    black: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  roundness: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
    },
    weights: {
      regular: '400',
      medium: '500',
      bold: '700',
    }
  }
} as const;

export type Theme = typeof theme;
