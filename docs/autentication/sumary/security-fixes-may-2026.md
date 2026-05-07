# Resumo — Correções de Segurança (Maio 2026)

**Data:** 2026-05-07  
**Status:** ✅ CONCLUÍDAS

---

## Problemas Identificados no Review

| # | Problema | Severidade | Ameaça |
|---|----------|------------|--------|
| 1 | Falta de proteção `useRequireAuth('admin')` nas telas admin | 🔴 CRÍTICA | T4 |
| 2 | Profile cacheado sem validação com servidor | 🟡 MÉDIA | T3 |
| 3 | CORS com fallback inseguro (`*`) | 🟡 MÉDIA | T8 |

---

## Correções Aplicadas

### 1. Proteção de Rotas Admin

**Arquivos modificados:**
- `app/admin/users/index.tsx` — adicionado `useRequireAuth('admin')`
- `app/admin/logs/index.tsx` — adicionado `useRequireAuth('admin')`
- `app/admin/metrics/index.tsx` — adicionado `useRequireAuth('admin')`

**Antes:** Qualquer usuário logado podia acessar `/admin/*` via URL direta.  
**Depois:** Todas as telas verificam role admin antes de renderizar.

```tsx
// Exemplo aplicado em cada tela admin:
export default function UsersScreen() {
  const { isAuthorized } = useRequireAuth('admin');
  const { users, isLoading } = useAdminUsers();

  if (!isAuthorized) {
    return null;
  }
  // ...
}
```

---

### 2. Validação de Perfil com Servidor

**Arquivos criados:**
- `supabase/functions/auth-validate/index.ts` — nova Edge Function

**Arquivos modificados:**
- `src/core/auth/AuthProvider.tsx` — validation logic na restauração de sessão

**Antes:** Ao restaurar sessão, o app usava o profile cacheado sem verificar se continuava válido (role poderia ter mudado, conta poderia ter sido suspensa).

**Depois:** Na restauração de sessão, o app chama `GET /auth-validate` para obter o profile fresco do banco. Se o servidor rejeitar (role mudou ou conta suspensa), limpa o storage local.

```typescript
// AuthProvider.tsx — validação na restauração
const res = await fetch(`${API_BASE}/auth-validate`, {
  headers: { Authorization: `Bearer ${storedToken}` },
});

if (res.ok) {
  const { profile: freshProfile } = await res.json();
  setProfile(freshProfile);
  await sessionStorage.setProfile(JSON.stringify(freshProfile));
} else {
  // Token invalidado — limpa local
  await sessionStorage.clearAll();
}
```

**Fallback:** Se a validação falhar (ex: offline), usa o cache como fallback para não bloquear o app.

---

### 3. CORS com Fallback Seguro

**Arquivos modificados:**
- `supabase/functions/_shared/cors.ts`

**Antes:**
```typescript
'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*'
```

**Depois:**
```typescript
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN');

if (!ALLOWED_ORIGIN) {
  console.error('[CORS] ALLOWED_ORIGIN não configurado...');
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN ?? 'null',
  // ...
};
```

**Mudança:** Se `ALLOWED_ORIGIN` não estiver configurado, usa `'null'` (rejeita todas as origens) em vez de `'*'` (aceita qualquer origem). Também adiciona log de erro para detecção.

---

## Problema Pendente (fora do escopo desta correção)

### Acesso Direto ao Supabase pelo Frontend (T1)

O frontend ainda usa `src/core/infra/supabaseClient.ts` com `ANON_KEY` para operações diretas em `models`:
- `modelSyncService.ts` — syncToRemote, deleteFromRemote
- `useRealtimeModels.ts` — realtime subscriptions
- `fetchRemoteModelsUseCase.ts` — fetch remote

**Impacto:** 尽管 RLS limita o acesso, a ANON_KEY está exposta no bundle.

**Solução sugerida (próxima sprint):**
| Operação | Edge Function |
|----------|---------------|
| syncToRemote | POST /models-sync |
| deleteFromRemote | DELETE /models/:id |
| Fetch modelos | GET /models |
| Realtime | SSE via Edge Function |

---

## Checklist de Verificação

- [x] Todas as telas admin verificam `useRequireAuth('admin')`
- [x] AuthProvider valida profile com servidor ao restaurar sessão
- [x] auth-validate Edge Function retorn profile fresco
- [x] CORS rejeita se `ALLOWED_ORIGIN` não configurado
- [x] Novo endpoint documentado nas variáveis de ambiente

---

## Variáveis de Ambiente Necessárias

```bash
# Supabase Edge Functions
ALLOWED_ORIGIN=https://ipu-calculator.vercel.app

# Frontend (.env.local)
EXPO_PUBLIC_EDGE_FUNCTIONS_URL=https://<project>.functions.supabase.co
```

---

## Riscos Mitigados

| Ameaça | Mitigação Aplicada |
|--------|-------------------|
| T3 — Escalada de privilégio | Profile validado com servidor a cada restauração de sessão |
| T4 — Acesso admin por não-admin | useRequireAuth('admin') em todas as rotas /admin/* |
| T8 — CSRF | CORS rejeita requisições se ALLOWED_ORIGIN não configurado |

---

## Próximos Passos

1. **Deploy das Edge Functions** — incluir `auth-validate` e `cors.ts` corrigido
2. **Configurar ALLOWED_ORIGIN** — no painel Supabase Edge Functions > Secrets
3. **Teste manual** — verificar que viewer não acessa /admin/*
4. **Teste manual** — mudar role de usuário, verificar que sessão perde acesso ao reopen app