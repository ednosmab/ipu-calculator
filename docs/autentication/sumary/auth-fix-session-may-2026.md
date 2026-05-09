# Resumo — Correção de Autenticação (Maio 2026)

**Data:** 2026-05-08

---

## Problema Inicial

- Login não funcionava
- Erro "Erro interno. Tente novamente"
- CORS bloqueando requisições do localhost
- Header `apikey` não enviado nas requisições

---

## Correções Aplicadas

### 1. Variáveis de Ambiente (.env)

Adicionado:
```
EXPO_PUBLIC_EDGE_FUNCTIONS_URL=https://uqihnpwpcrujqycbuzxv.supabase.co/functions/v1
```

### 2. Header apikey

Adicionado em todas as chamadas fetch:
- `edgeFunctionsClient.ts`
- `AuthProvider.tsx`

### 3. CORS (supabase/functions/_shared/cors.ts)

Corrigido para permitir localhost:
```typescript
if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
  return new Response(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin,
    },
  });
}
```

### 4. Imports das Edge Functions

Mudança de `esm.sh` para `npm:`:
```typescript
// Antes
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Depois
import { createClient } from 'npm:@supabase/supabase-js@2';
```

### 5. sessionStorage.ts

Corrigido para detectar web corretamente:
```typescript
const isWeb = typeof window !== 'undefined';
```

---

## Edge Functions Deployadas

- auth-login
- auth-logout
- auth-validate
- models-sync
- models-delete
- models-get
- admin-users
- admin-users-update
- admin-logs
- admin-metrics

---

## Usuário Admin

- **Email:** admin2@ipu.com
- **Senha:** Admin123456

---

## Testes

```
Test Suites: 19 passed, 19 total
Tests: 99 passed, 1 skipped, 100 total
```

---

## Próximos Passos

1. Testar login no http://localhost:3000/login
2. Verificar se modelos carregam após login
3. Configurar deploy para produção (Vercel)