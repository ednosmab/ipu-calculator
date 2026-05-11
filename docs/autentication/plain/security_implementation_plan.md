# Plano de Implementação — Sistema de Segurança e Acesso

## Contexto

O IPU Calculator é uma aplicação React Native + Expo com deploy PWA na Vercel e backend no Supabase. O acesso ao app é controlado pelo engenheiro responsável — o link não é público e os usuários são cadastrados manualmente. A calculadora é de uso livre, mas a tela de Modelos exige autenticação.

---

## Modelo de Acesso

```
Engenheiro (admin)
  → cadastra usuários manualmente
  → define role: viewer ou editor
  → monitora logs e métricas no painel admin

Usuário viewer
  → acessa a calculadora livremente
  → acessa a lista de modelos (somente leitura)

Usuário editor
  → acessa a calculadora livremente
  → acessa a lista de modelos
  → cria, edita e exclui modelos

Sem conta
  → acessa somente a calculadora
```

---

## Fases de Implementação

---

### FASE 1 — Supabase (fundação)

**Estimativa: 1 semana**

#### 1.1 — Ativar Supabase Auth

- Ativar autenticação por email + senha no painel do Supabase
- Desativar auto-cadastro (sign-up público) — só admin cria usuários
- Configurar templates de email (confirmação, reset de senha)

#### 1.2 — Custom Claims (role no JWT)

Criar função no Supabase que injeta o role no JWT automaticamente após login:

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (event->>'userId')::uuid;

  claims := event->'claims';
  claims := jsonb_set(claims, '{role}', to_jsonb(user_role));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql;
```

#### 1.3 — Tabela profiles

```sql
CREATE TABLE public.profiles (
  id        uuid REFERENCES auth.users ON DELETE CASCADE,
  name      text NOT NULL,
  role      text NOT NULL DEFAULT 'viewer'
              CHECK (role IN ('admin', 'editor', 'viewer')),
  active    boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_seen  timestamptz,
  PRIMARY KEY (id)
);
```

#### 1.4 — RLS na tabela models

```sql
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Leitura: todos autenticados e ativos
CREATE POLICY "models_select" ON models
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND active = true
    )
  );

-- Escrita: somente editor e admin
CREATE POLICY "models_insert" ON models
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('editor', 'admin')
        AND active = true
    )
  );

CREATE POLICY "models_update" ON models
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('editor', 'admin')
        AND active = true
    )
  );

CREATE POLICY "models_delete" ON models
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('editor', 'admin')
        AND active = true
    )
  );
```

#### 1.5 — Tabela access_logs

```sql
CREATE TABLE public.access_logs (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users,
  action     text NOT NULL,
  resource   text,
  metadata   jsonb,
  ip         text,
  platform   text,
  created_at timestamptz DEFAULT now()
);

-- Ações possíveis: login, logout, login_failed,
--   model_view, model_create, model_edit, model_delete,
--   admin_access, user_created, user_suspended, role_changed
```

#### 1.6 — Tabela usage_metrics

```sql
CREATE TABLE public.usage_metrics (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users,
  event      text NOT NULL,
  metadata   jsonb,
  created_at timestamptz DEFAULT now()
);

-- Eventos possíveis: calculation_run, model_selected,
--   session_start, session_end
```

---

### FASE 2 — Edge Functions (lógica de segurança)

**Estimativa: 1–2 semanas**

#### 2.1 — Middleware de autorização

Validado em todas as Edge Functions antes de qualquer lógica:

```typescript
// shared/authMiddleware.ts
import { createClient } from '@supabase/supabase-js';

export async function requireAuth(req: Request, minRole?: string) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('UNAUTHORIZED');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) throw new Error('UNAUTHORIZED');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', user.id)
    .single();

  if (!profile?.active) throw new Error('ACCOUNT_SUSPENDED');

  const roles = ['viewer', 'editor', 'admin'];
  if (minRole && roles.indexOf(profile.role) < roles.indexOf(minRole)) {
    throw new Error('FORBIDDEN');
  }

  return { user, profile };
}
```

#### 2.2 — POST /auth/login

- Valida email + senha via Supabase Auth
- Registra log: `login` ou `login_failed`
- Registra `session_start` em usage_metrics
- Retorna JWT com role embutido

#### 2.3 — POST /auth/logout

- Invalida sessão
- Registra log: `logout`
- Registra `session_end` em usage_metrics

#### 2.4 — GET /admin/users

- Requer role `admin`
- Retorna lista de usuários com name, email, role, active, last_seen
- Registra log: `admin_access`

#### 2.5 — POST /admin/users

- Requer role `admin`
- Cria usuário via `supabase.auth.admin.createUser`
- Cria registro em profiles com role definido
- Registra log: `user_created`

#### 2.6 — PATCH /admin/users/:id

- Requer role `admin`
- Atualiza role ou campo active
- Registra log: `role_changed` ou `user_suspended`

#### 2.7 — GET /admin/logs

- Requer role `admin`
- Suporta filtros: user_id, action, data início, data fim
- Paginação: limit + offset

#### 2.8 — GET /admin/metrics

- Requer role `admin`
- Retorna agregações:
  - Usuários ativos nos últimos 7/30 dias
  - Logins por dia (últimos 30 dias)
  - Cálculos realizados por usuário
  - Modelos mais acessados
  - Ações por tipo no período

---

### FASE 3 — Frontend

**Estimativa: 1–2 semanas**

#### 3.1 — AuthContext

Contexto global que expõe `user`, `profile`, `signIn`, `signOut` e `isLoading`. Persiste sessão no SecureStore (nativo) e sessionStorage (web).

#### 3.2 — Proteção de rotas

```typescript
// hooks/useRequireAuth.ts
export function useRequireAuth(minRole?: string) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
    if (!isLoading && minRole && !hasRole(profile?.role, minRole)) {
      router.replace('/unauthorized');
    }
  }, [user, profile, isLoading]);
}
```

#### 3.3 — Tela de login

- Modal antes de acessar `/models`
- Campos: email + senha
- Feedback de erro: credenciais inválidas, conta suspensa
- Sem opção de auto-cadastro

#### 3.4 — UI adaptada por role

```
viewer  →  lista de modelos visível, botões criar/editar ocultos
editor  →  lista + botões criar/editar visíveis
admin   →  tudo acima + link para /admin
```

#### 3.5 — Painel Admin (/admin)

**Aba Usuários**
- Tabela: nome, email, role, status, último acesso
- Botão "Novo usuário" — formulário com nome, email, senha, role
- Ação por linha: alterar role, suspender/reativar

**Aba Logs**
- Tabela com filtros: usuário, tipo de ação, período
- Exportar CSV

**Aba Métricas**
- Cards: total de usuários, ativos hoje, cálculos realizados
- Gráfico: logins por dia (últimos 30 dias)
- Gráfico: cálculos por usuário
- Lista: modelos mais acessados

---

## Cronograma

| Semana | Entrega |
|--------|---------|
| 1 | Fase 1 completa — Supabase configurado |
| 2 | Fase 2: auth endpoints + middleware |
| 3 | Fase 2: admin endpoints + logs + métricas |
| 4 | Fase 3: login + proteção de rotas + UI por role |
| 5 | Fase 3: painel admin completo |

---

## Ameaças mitigadas

| Ameaça | Mitigação |
|--------|-----------|
| ANON_KEY exposta no bundle | App não chama Supabase diretamente — tudo via Edge Functions com service key no servidor |
| Acesso não autorizado à tabela models | RLS + autenticação obrigatória |
| Usuário suspenso continua acessando | Campo `active` verificado em toda requisição |
| Escalada de privilégio | Role verificado no servidor, nunca confiado pelo cliente |
| Acesso ao painel admin | Rota protegida por role `admin` no middleware |
| Dados sem auditoria | Toda ação registrada em access_logs |

---

## O que este plano não cobre (fora de escopo por ora)

- Segundo fator de autenticação (SMS/TOTP)
- Criptografia dos campos `inputs` em repouso no Supabase
- Rate limiting nos endpoints
- Rotação automática de JWT
