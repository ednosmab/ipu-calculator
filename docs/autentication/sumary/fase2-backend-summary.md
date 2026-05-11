# Resumo — Fase 2: Backend Dev (Edge Functions)

**Data:** 2026-05-06  
**Status:** ✅ CONCLUÍDA

---

## O que foi implementado

### Estrutura criada

```
supabase/functions/
  _shared/
    cors.ts              ✅ Headers CORS com ALLOWED_ORIGIN do env
    response.ts          ✅ ok() e err() padronizados
    authMiddleware.ts    ✅ requireAuth() com AuthError tipado
    auditLogger.ts       ✅ logAccess() fire-and-forget
  auth-login/index.ts        ✅
  auth-logout/index.ts       ✅
  admin-users/index.ts       ✅ GET + POST
  admin-users-update/index.ts ✅ PATCH
  admin-logs/index.ts        ✅ filtros + paginação
  admin-metrics/index.ts     ✅ agregações completas
```

### Endpoints implementados

| Endpoint | Método | Role mínimo | Descrição |
|----------|--------|-------------|-----------|
| `/auth-login` | POST | — | Login, registra log/metric |
| `/auth-logout` | POST | viewer | Invalida sessão server-side |
| `/admin-users` | GET | admin | Lista usuários + emails |
| `/admin-users` | POST | admin | Cria usuário + profile (rollback em falha) |
| `/admin-users-update` | PATCH | admin | Atualiza role/active, bloqueia auto-suspensão |
| `/admin-logs` | GET | admin | Logs com 6 filtros + paginação (50/página) |
| `/admin-metrics` | GET | admin | 4 cards + 3 datasets de gráficos |

### Regras aplicadas
- ✅ Toda função (exceto `auth-login`) chama `requireAuth` antes de qualquer lógica
- ✅ `requireAuth` verifica `active === true` no banco, não só no JWT
- ✅ CORS via `ALLOWED_ORIGIN` do env — nunca `*`
- ✅ `SERVICE_ROLE_KEY` lida de `Deno.env.get()`, nunca hardcoded
- ✅ Erros retornam `INTERNAL_ERROR` sem vazar stack trace
- ✅ `logAccess` sempre fire-and-forget (sem await)
- ✅ `admin-users-update` bloqueia `targetId === user.id && active === false`
- ✅ `auth-login` registra `login_failed` mesmo sem user_id (T9: sempre INVALID_CREDENTIALS)
- ✅ Preflight OPTIONS retorna 200 com headers CORS

---

## Checklist do skill `edge_functions_protocol.md`

- [x] Helpers _shared criados: cors, response, authMiddleware, auditLogger
- [x] CORS restrito ao domínio via env
- [x] Todas as funções usam SERVICE_ROLE_KEY
- [x] auth-login registra login e login_failed
- [x] auth-logout invalida sessão e registra log
- [x] admin-users GET retorna lista com last_seen
- [x] admin-users POST cria usuário + perfil (com rollback)
- [x] admin-users-update valida auto-suspensão
- [x] admin-logs com filtros e paginação
- [x] admin-metrics retorna agregações corretas

---

## Variáveis de ambiente necessárias

```bash
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
ALLOWED_ORIGIN=https://ipu-calculator.vercel.app
```

> Configurar em: Supabase Dashboard > Edge Functions > Secrets

---

## Riscos mitigados nesta fase

| Ameaça | Mitigação |
|--------|-----------|
| T1 — ANON_KEY no bundle | App nunca chama Supabase direto; SERVICE_ROLE_KEY só no servidor |
| T4 — Acesso admin por não-admin | `requireAuth(req, 'admin')` em todos os endpoints admin |
| T5 — Conta suspensa com sessão | `requireAuth` verifica `active` no banco a cada request |
| T8 — CSRF | CORS restrito ao domínio da Vercel |
| T9 — Enumeração de usuários | Login retorna sempre `INVALID_CREDENTIALS` |
| T10 — Admin auto-suspensão | Bloqueio explícito no `admin-users-update` |
