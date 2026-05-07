# SKILL: Access Logs Protocol

Este protocolo define como registrar e consultar logs de acesso no IPU Calculator. Toda ação relevante deve ser auditável.

---

## 📋 Estrutura de Dados

### access_logs — Auditoria de ações

```sql
CREATE TABLE public.access_logs (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users ON DELETE SET NULL,
  action     text NOT NULL,
  resource   text,
  metadata   jsonb,
  ip         text,
  platform   text, -- 'ios' | 'android' | 'web'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_access_logs_user_id   ON access_logs(user_id);
CREATE INDEX idx_access_logs_action    ON access_logs(action);
CREATE INDEX idx_access_logs_created_at ON access_logs(created_at DESC);
```

---

## 🎬 Catálogo de Ações

### access_logs — ações registradas

| action | quando registrar | resource |
|--------|-----------------|----------|
| `login` | login bem-sucedido | `auth` |
| `login_failed` | credenciais inválidas | `auth` |
| `logout` | logout explícito | `auth` |
| `model_create` | modelo criado com sucesso | `models:{id}` |
| `model_edit` | modelo editado com sucesso | `models:{id}` |
| `model_delete` | modelo excluído | `models:{id}` |
| `admin_access` | painel admin aberto | `admin` |
| `user_created` | admin criou novo usuário | `users:{id}` |
| `user_suspended` | admin suspendeu usuário | `users:{id}` |
| `role_changed` | admin alterou role | `users:{id}` |

---

## 🔧 Logger de Auditoria (Edge Function)

```typescript
// shared/auditLogger.ts
import { SupabaseClient } from '@supabase/supabase-js';

interface LogParams {
  supabase: SupabaseClient;
  userId: string | null;
  action: string;
  resource?: string;
  metadata?: Record<string, unknown>;
  req: Request;
}

export async function logAccess({
  supabase, userId, action, resource, metadata, req
}: LogParams): Promise<void> {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const userAgent = req.headers.get('user-agent') ?? '';
  const platform = detectPlatform(userAgent);

  const { error } = await supabase.from('access_logs').insert({
    user_id:  userId,
    action,
    resource,
    metadata,
    ip,
    platform,
  });

  if (error) {
    console.error('[AuditLogger] Falha ao registrar log:', error.message);
  }
}

function detectPlatform(userAgent: string): string {
  if (userAgent.includes('Expo')) return 'native';
  if (userAgent.includes('Android')) return 'android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'ios';
  return 'web';
}
```

### Uso nas Edge Functions

```typescript
await logAccess({
  supabase,
  userId: user.id,
  action: 'model_create',
  resource: `models:${newModel.id}`,
  metadata: { name: newModel.name, type: newModel.type },
  req,
});
```

---

## 📊 Queries de Métricas (Admin)

### Usuários ativos por período

```sql
SELECT
  COUNT(DISTINCT user_id) AS active_users
FROM access_logs
WHERE
  action = 'login'
  AND created_at >= NOW() - INTERVAL '30 days';
```

### Logins por dia (últimos 30 dias)

```sql
SELECT
  DATE(created_at) AS day,
  COUNT(*) AS logins
FROM access_logs
WHERE
  action = 'login'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day;
```

---

## 🖥️ Painel Admin — Aba Logs

**Filtros disponíveis:**
- Usuário (select com lista de usuários)
- Tipo de ação (multiselect com catálogo)
- Período (data início + data fim)

**Colunas da tabela:**
- Data/hora, Usuário, Ação, Recurso, Plataforma, IP

**Exportar CSV:** gera arquivo com os registros filtrados

---

## 🖥️ Painel Admin — Aba Métricas

**Cards de resumo:**
- Usuários ativos hoje
- Usuários ativos nos últimos 30 dias
- Total de modelos cadastrados
- Total de usuários

**Gráficos:**
- Logins por dia — linha, últimos 30 dias

---

## ⚠️ Regras de Ouro

1. **Log nunca bloqueia a operação principal** — fire-and-forget, erros no console mas não propagados
2. **login_failed deve ser registrado mesmo sem user_id** — guarda o email tentado no metadata
3. **Dados sensíveis nunca entram no metadata** — senhas, tokens e dados pessoais completos são omitidos
4. **RLS em access_logs** — somente admin pode ler, nenhum usuário pode escrever diretamente

---

## 📋 Checklist de implementação

- [ ] Tabela access_logs criada com índices
- [ ] RLS em access_logs: somente leitura para admin
- [ ] auditLogger implementado e importado nas Edge Functions
- [ ] Endpoint GET /admin/logs com filtros e paginação
- [ ] Endpoint GET /admin/metrics retornando agregações
- [ ] Painel admin exibe logs e métricas corretamente
- [ ] Exportar CSV funciona na aba Logs