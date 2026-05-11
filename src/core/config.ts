// src/core/config.ts
// Centraliza configurações de ambiente

export const CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL
    ?? 'https://uqihnpwpcrujqycbuzxv.supabase.co',

  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    ?? '',

  EDGE_FUNCTIONS_URL: process.env.EXPO_PUBLIC_EDGE_FUNCTIONS_URL
    ?? 'https://uqihnpwpcrujqycbuzxv.supabase.co/functions/v1',
} as const;