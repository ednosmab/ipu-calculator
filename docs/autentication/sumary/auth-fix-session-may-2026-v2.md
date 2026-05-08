# Resumo — Correção de Autenticação V2 (Maio 2026)

**Data:** 2026-05-08  
**Status:** ✅ CONCLUÍDO

---

## Problema Inicial

- Login funcionava, mas modelos não eram carregados
- Edge Functions falhavam com erro `INVALID_PAYLOAD` ou `UNAUTHORIZED_INVALID_JWT_FORMAT`
- CORS bloqueava requisições do localhost
- Modelos ficavam "pendentes" sem sincronizar

---

## Causa Raiz

Todas as 11 Edge Functions usavam a variável de ambiente errada:

```typescript
// ERRADO
Deno.env.get('SUPABASE_SECRET_KEYS')!

// CORRETO
Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
```

Isso fazia com que o Supabase Client fosse criado com `undefined` como service key, causando falhas silenciosas em todas as operações de banco.

---

## Correções Aplicadas

### 1. Variáveis de Ambiente — 11 arquivos

Corrigido `SUPABASE_SECRET_KEYS` → `SUPABASE_SERVICE_ROLE_KEY` em:

```
admin-logs/index.ts
admin-metrics/index.ts
admin-users-update/index.ts
admin-users/index.ts
auth-logout/index.ts
check-users/index.ts
create-admin/index.ts
models-delete/index.ts
models-get/index.ts
models-sync/index.ts
```

### 2. CORS — `supabase/functions/_shared/cors.ts`

Corrigido `getCorsHeaders()` para detectar `localhost` e permitir a origem dinamicamente:

```typescript
export function getCorsHeaders(origin?: string | null) {
  const isLocal = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
  const allowedOrigin = isLocal ? origin : (origin && validOrigins.includes(origin) ? origin : validOrigins[0]);
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': allowedOrigin ?? validOrigins[0],
  };
}
```

### 3. Respostas de Erro — `supabase/functions/_shared/response.ts`

Corrigido `err()` para usar CORS dinâmico (antes hardcoded `*`):

```typescript
export function err(code: string, status: number, origin?: string | null): Response {
  return new Response(JSON.stringify({ error: code, status }), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      ...getCorsHeaders(origin),
    },
  });
}
```

### 4. Auth Login — `supabase/functions/auth-login/index.ts`

Passou `origin` do header para todas as chamadas de `ok()` e `err()`:

```typescript
const origin = req.headers.get('origin');
// ...
return ok({ session: data.session, profile }, 200, origin);
return err('INVALID_CREDENTIALS', 401, origin);
```

### 5. SQL — Role atualizado

Executado no SQL Editor do Supabase:

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'a41d5d1d-58ef-4a38-b0a4-64bf22dad2cb';
```

---

## Deploy

```bash
npx supabase functions deploy
```

Resultado: 13 Edge Functions atualizadas.

---

## Testes Validados

| Cenário | Resultado |
|---------|-----------|
| Login via localhost | ✅ Sucesso |
| Carregar modelos | ✅ Sucesso |
| Criar novo modelo | ✅ Sucesso |
| CORS localhost | ✅ Permitido |
| CORS staging | ✅ Permitido |
| CORS production | ✅ Permitido |

---

## Estado Atual

- Login funcionando com `admin2@ipu.com`
- Modelos sincronizando corretamente
- CORS configurado para 3 origens: localhost, staging, production

---

## Notas

- O JWT ainda mostra `role: viewer` no payload (devido ao Custom Access Token Hook não estar atualizando), mas a Edge Function `requireAuth` busca o role diretamente no banco de dados, então funciona corretamente.
- Para forçar novo JWT com role correto, fazer logout/login novamente.

---

## Próximos Passos

1. Verificar se o Custom Access Token Hook está ativo no Supabase Dashboard
2. Testar em produção (ipu-calculator.vercel.app)
3. Implementar plano pendente: PWA Install Pill