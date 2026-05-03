export const CACHE_VERSION = {
  SCHEMA: '2.1.0',
  SW: process.env.EXPO_PUBLIC_APP_VERSION ?? 'dev',
  MODEL_TTL_MS: 48 * 60 * 60 * 1000,
} as const;