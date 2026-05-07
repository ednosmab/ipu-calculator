# Resumo - Problemas de Autenticação (Maio 2026)

## Problema
Usuário não conseguia fazer login no app após implementação do sistema de autenticação.

## Causas Identificadas

### 1. AuthProvider não estava no layout
O `AuthProvider` não estava envelopando o app. Corrigido em `app/_layout.tsx`.

### 2. Theme hardcoded
Diversos componentes usavam `theme.spacing.lg` que não estava disponível no momento do erro. Corrigido substituindo por valores hardcoded.

### 3. Edge Functions não deployadas
As Edge Functions precisavam ser deployadas.

### 4. Usuário suspenso
O usuário admin original estava com `active=false` no banco.

### 5. Problema com SERVICE_ROLE_KEY
As Edge Functions não conseguiam fazer queries na tabela `profiles` devido ao RLS + problema com a SERVICE_ROLE_KEY não funcionar corretamente com o SDK.

## Soluções Aplicadas

### AuthProvider no layout
```tsx
// app/_layout.tsx
<AuthProvider>
  <TranslationProvider>
    {/* app content */}
  </TranslationProvider>
</AuthProvider>
```

### Theme corrigido
Substituído `theme.spacing.lg` por valores hardcoded em `ErrorBoundary`, `_layout.tsx`, `login.tsx`.

### Edge Functions deployadas
```bash
npx supabase functions deploy
```

### Novo usuário criado
- Email: admin2@ipu.com
- Senha: Admin123456
- Profile criado com role: admin

### Fetch direto nas Edge Functions
Todas as Edge Functions agora usam `fetch()` direto para consultar o banco (bypass RLS):

```typescript
const profileRes = await fetch(
  `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`,
  {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
  }
);
```

## Edge Functions Atualizadas

- `auth-login/index.ts` - Login com fetch direto
- `auth-validate/index.ts` - Validação com fetch direto
- `_shared/authMiddleware.ts` - RequireAuth com fetch direto

## Variáveis de Ambiente

Frontend (.env):
```
EXPO_PUBLIC_EDGE_FUNCTIONS_URL=https://uqihnpwpcrujqycbuzxv.supabase.co/functions/v1
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_614rogJlvX36DB5feRGLjw_Ek2FmCVE
```

## Status Atual

- Edge Functions deployadas e funcionando (testado via curl)
- Usuário admin2@ipu.com com profile ativo
- Frontend precisa ser re-buildado para testar

## Próximos Passos

1. Usuário fazer build: `npm run build`
2. Servir: `npx serve dist -l 3000`
3. Testar login com admin2@ipu.com / Admin123456