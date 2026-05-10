# Resumo — Fase 1: DBA (Supabase SQL)

**Data:** 2026-05-06  
**Status:** ✅ CONCLUÍDA

---

## O que foi implementado

### Arquivo gerado
`supabase/migrations/001_auth_security.sql`

### Tabelas criadas

| Tabela | Finalidade |
|--------|-----------|
| `profiles` | Armazena name, role (admin/editor/viewer), active, last_seen |
| `access_logs` | Auditoria de todas as ações (login, CRUD, admin) |
| `usage_metrics` | Eventos de uso (cálculos, sessões, modelos) |

### RLS aplicado

| Tabela | Policies |
|--------|---------|
| `models` | SELECT (viewer+), INSERT/UPDATE/DELETE (editor+) — ativas verificam `active = true` |
| `profiles` | SELECT próprio registro |
| `access_logs` | SELECT somente admin ativo |
| `usage_metrics` | SELECT somente admin ativo |

### Custom Claims Hook
- Função `public.custom_access_token_hook` injetando `role` no JWT a cada login
- GRANT concedido ao `supabase_auth_admin`

### Padrões seguidos
- ✅ SQL 100% idempotente (`CREATE IF NOT EXISTS`, `DROP POLICY IF EXISTS`)
- ✅ CHECK constraint em `role` limitado a `admin`, `editor`, `viewer`
- ✅ Índices em `user_id`, `action`, `created_at` nas tabelas de log
- ✅ RLS habilitado antes das policies
- ✅ Nenhum dado removido sem confirmação

---

## Checklist do skill `rbac_protocol.md`

- [x] RLS habilitado na tabela models
- [x] As quatro policies criadas (SELECT, INSERT, UPDATE, DELETE)
- [x] `requireAuth` aplicado — implementado na Fase 2
- [x] Índices em user_id, action, created_at
- [x] SQL idempotente (IF NOT EXISTS / DROP IF EXISTS)
- [x] Custom Claims injeta `role` no JWT

---

## Ação manual necessária no Supabase Dashboard

1. **Ativar o hook:** `Authentication > Hooks > Custom Access Token > custom_access_token_hook`
2. **Desativar sign-up público:** `Authentication > Settings > Disable signup`
3. **Configurar templates de email** (confirmação, reset de senha)
4. **Executar o SQL** no SQL Editor do Supabase

---

## Riscos mitigados nesta fase

| Risco | Mitigação aplicada |
|-------|--------------------|
| T2 — Acesso não autorizado a models | RLS com autenticação obrigatória |
| T3 — Escalada de privilégio | RLS verifica role no banco, não no JWT |
| T5 — Conta suspensa ativa | `active = true` verificado em todas as policies |
