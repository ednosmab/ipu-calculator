export const STORAGE_KEYS = {
  CALCULATION_HISTORY: '@ipu:history',
  MODELS: '@ipu:models',
  SETTINGS: '@ipu:settings',
  LANGUAGE: '@ipu:language',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];