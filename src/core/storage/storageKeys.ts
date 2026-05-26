export const STORAGE_KEYS = {
  CALCULATION_HISTORY: '@ipu:history',
  MODELS: '@ipu:models',
  SETTINGS: '@ipu:settings',
  LANGUAGE: '@ipu:language',
  PENDING_DELETES: '@ipu:pending_deletes',
  PENDING_EDITS: '@ipu:pending_edits',
  SCHEMA_VERSION: '@ipu:schema_version',
  CACHE_VERSION: '@ipu:cache_version',
  DEVICE_ID: '@ipu:device_id',
  MODELS_BACKUP: '@ipu:models_backup',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];