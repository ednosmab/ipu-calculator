# Sistema de Agentes — IPU Calculator Security Plan

Este diretório contém os arquivos de contexto para os agentes de IA que vão implementar o plano de segurança do IPU Calculator. Cada arquivo define a identidade, responsabilidade, regras e referências de um agente específico.

---

## Agentes disponíveis

| Arquivo | Agente | Fase |
|---------|--------|------|
| `agent_dba.md` | DBA | Fase 1 — Supabase |
| `agent_backend_dev.md` | Backend Dev | Fase 2 — Edge Functions |
| `agent_frontend_dev.md` | Frontend Dev | Fase 3 — Auth & Rotas |
| `agent_admin_dev.md` | Admin Dev | Fase 3 — Painel Admin |
| `agent_security_reviewer.md` | Security Reviewer | Revisão contínua |

---

## Ordem de execução

```
1. DBA
   → entrega: SQL completo (tabelas, RLS, Custom Claims)
   → revisão: Security Reviewer

2. Backend Dev
   → entrega: Edge Functions (_shared + endpoints)
   → depende: tabelas e RLS do DBA já aplicados
   → revisão: Security Reviewer

3. Frontend Dev
   → entrega: AuthContext, sessionStorage adapter, useRequireAuth, tela de login
   → depende: endpoints /auth-login e /auth-logout do Backend Dev
   → revisão: Security Reviewer

4. Admin Dev
   → entrega: painel /admin completo
   → depende: endpoints /admin-* do Backend Dev + AuthContext do Frontend Dev
   → revisão: Security Reviewer
```

---

## Como usar no Antigravity

1. Abra o agente da fase atual como arquivo de contexto na sessão
2. Referencie os arquivos de skill em `docs/skill/` quando o agente pedir
3. Após cada entrega, abra `agent_security_reviewer.md` e cole o código gerado para revisão
4. Só avance para o próximo agente após o Security Reviewer aprovar

---

## Estrutura esperada do projeto após implementação

```
supabase/
  functions/
    _shared/
      cors.ts
      response.ts
      authMiddleware.ts
      auditLogger.ts
    auth-login/index.ts
    auth-logout/index.ts
    admin-users/index.ts
    admin-users-update/index.ts
    admin-logs/index.ts
    admin-metrics/index.ts

src/
  core/
    auth/
      AuthContext.tsx
      AuthProvider.tsx
      sessionStorage.ts
  hooks/
    useAuth.ts
    useRequireAuth.ts
    usePermissions.ts
    admin/
      useAdminUsers.ts
      useAdminLogs.ts
      useAdminMetrics.ts
  components/
    admin/
      UserTable.tsx
      CreateUserModal.tsx
      LogTable.tsx
      LogFilters.tsx
      ExportCsvButton.tsx
      MetricCard.tsx
      LoginChart.tsx
      UsageBarChart.tsx
      TopModelsList.tsx

app/
  login.tsx
  models/index.tsx     ← proteção adicionada
  admin/
    index.tsx
    users/
      index.tsx
      new.tsx
    logs/index.tsx
    metrics/index.tsx

docs/
  plain/
    security_implementation_plan.md
  skill/
    authentication_protocol.md
    rbac_protocol.md
    access_logs_metrics_protocol.md
    admin_panel_protocol.md
    edge_functions_protocol.md
    security_threat_model.md
  agents/
    agent_dba.md
    agent_backend_dev.md
    agent_frontend_dev.md
    agent_admin_dev.md
    agent_security_reviewer.md
    README.md
```
