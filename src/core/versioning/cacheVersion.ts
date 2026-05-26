import { APP_VERSION } from '@/core/version';

export const CACHE_VERSION = {
  SCHEMA: '2.2.0',
  SW: APP_VERSION,
  MODEL_TTL_MS: 48 * 60 * 60 * 1000,
} as const;