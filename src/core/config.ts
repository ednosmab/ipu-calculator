// src/core/config.ts
// Centraliza configurações de ambiente
// As vars EXPO_PUBLIC_* são injetadas em tempo de build pelo Metro.
// Se ausentes, o app emite warning e tenta operar — chamadas de rede falharão graciosamente.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const edgeFunctionsUrl = process.env.EXPO_PUBLIC_EDGE_FUNCTIONS_URL ?? '';

if (!supabaseUrl) {
  console.warn(
    '[Config] EXPO_PUBLIC_SUPABASE_URL não definida. Configure em .env.local ou no painel da Vercel.'
  );
}
if (!edgeFunctionsUrl) {
  console.warn(
    '[Config] EXPO_PUBLIC_EDGE_FUNCTIONS_URL não definida. Configure em .env.local ou no painel da Vercel.'
  );
}

export const CONFIG = {
  SUPABASE_URL: supabaseUrl,

  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    ?? '',

  EDGE_FUNCTIONS_URL: edgeFunctionsUrl,
} as const;
