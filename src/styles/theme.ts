/**
 * Design System tokens and theme configuration.
 */
export const theme = {
  colors: {
    bg: '#0F1115',           // Slate Charcoal
    card: '#1C1F26',         // Graphite Surface
    input: '#15191F',        // Deep Input BG
    primary: '#649991',      // Industrial Teal
    primaryDark: '#4E7A74',  // Darker Teal for pressed states
    success: '#94A684',      // Ergonomic Sage
    text: '#C5C9D1',         // Silver Sand (low fatigue text)
    textSecondary: '#717984', // Muted Slate
    border: '#313943',       // Subtle Graphite Border
    error: '#E57373',        // Soft Muted Red
    white: '#FFFFFF',
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
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
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
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    }
  }
} as const;

export type Theme = typeof theme;
