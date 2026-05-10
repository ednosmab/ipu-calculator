# Análise do Plano — Sistema de Segurança e Acesso

## 1. Objetivo Principal

Implementar um **sistema de autenticação e controle de acesso granular** para o IPU Calculator. A calculadora permanece pública, mas o acesso à tela de Modelos é controlado via roles, com painel administrativo para gestão de usuários e monitoramento.

---

## 2. Funcionalidades Principais

| Módulo | Funcionalidade |
|--------|---------------|
| **Auth** | Login/logout via email + senha (Supabase Auth) |
| **RBAC** | Roles: `admin` > `editor` > `viewer` (hierarquia ordinal) |
| **Proteção de rotas** | Redirecionamento para `/login` se sessão ausente |
| **Gestão de usuários** | Criar, editar role, suspender/reativar (admin only) |
| **Auditoria** | `access_logs` — todas as ações registradas |
| **Métricas** | `usage_metrics` — logins, cálculos, modelos usados |
| **Painel admin** | UI para gestão de usuários, logs e métricas |

---

## 3. Arquitetura em Camadas

```
INTERFACE (UI)          → AuthContext, useRequireAuth, Painel Admin
        │
        ▼
SERVICE (Edge Fn)       → auth-login, admin-users, requireAuth
        │
        ▼
STORAGE (Supabase)      → auth.users, profiles, models, RLS policies
        │
        ▼
DOMAIN                  → User, Profile, AccessLog, role hierarchy
```

---

## 4. Riscos Técnicos

| # | Risco | Severidade |
|---|-------|------------|
| R1 | JWT não é revogável — suspensão só efetiva no próximo request | Alta |
| R2 | sessionStorage vulnerável a XSS | Alta |
| R3 | Custom Claims atualiza apenas no login — role pode ficar desatualizado | Média |
| R4 | Sem rate limiting no login | Média |
| R5 | requireAuth depende de rede — offline = falha | Alta |
| R6 | logs fire-and-forget sem retry | Baixa |
| R7 | Sem mecanismo de logout forçado pelo admin | Média |

---

## 5. Pontos Ambíguos

- **A1**: Modal ou screen de login? UX não especificada
- **A2**: O que acontece quando JWT expira durante uso?
- **A3**: Proteção da calculadora não detalhada
- **A4**: Admin reset de senha não definido
- **A5**: Como `last_seen` é atualizado?
- **A6**: Painel admin usa cache ou dados frescos?

---

## 6. Decisões Pendentes

| # | Decisão | Sugestão |
|---|---------|----------|
| D1 | Refresh token? | Adicionar `POST /auth-refresh` |
| D2 | Expiração local da sessão? | Adicionar timestamp no storage |
| D3 | Fallback offline? | Cachear `profile` localmente |
| D4 | Tempo de expiração JWT | 15-30 min para app interno |
| D5 | Dados em tempo real no admin? | Cache métricas (5 min TTL) |

---

## 7. Sugestões de Melhoria

1. **S1** — Adicionar endpoint `POST /auth-refresh`
2. **S2** — Cache local do `profile` (criptografado)
3. **S3** — Adicionar campo `suspended_at` para logout forçado
4. **S4** — Rate limiting no login (5 tentativas/min)
5. **S5** — Endpoint `POST /admin-users-reset-password`
6. **S6** — Trigger SQL para atualizar `last_seen`
7. **S7** — Cache de métricas com refresh manual
8. **S8** — "Logout de todos os dispositivos"
9. **S9** — Verificação de `active` no client-side
10. **S10** — Documentar variáveis de ambiente

---

## 8. Veredicto

**PLANO SÓLIDO** — segue melhores práticas de defesa em profundidade (RLS + middleware + UI). Cob principais ameaças.

**Deficiências principais:**
- Ausência de refresh token
- Logout forçado inexistente
- Fallback offline não definido

**Recomenda-se** resolver riscos altos (R1, R2, R5) e decisões pendentes (D1, D2, D3) antes da implementação.