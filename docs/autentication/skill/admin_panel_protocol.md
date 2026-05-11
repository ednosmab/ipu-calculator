# SKILL: Admin Panel Protocol

Este protocolo define como o painel administrativo do IPU Calculator deve ser implementado — estrutura de navegação, telas, componentes e fluxos de gestão de usuários.

---

## 🏗️ Estrutura de Rotas

```
/admin                  →  redirect para /admin/users
/admin/users            →  lista e gestão de usuários
/admin/users/new        →  formulário de criação
/admin/logs             →  logs de acesso com filtros
/admin/metrics          →  métricas e gráficos de uso
```

Todas as rotas verificam `role === 'admin'` via `useRequireAuth('admin')`. Qualquer acesso sem o role correto redireciona para `/unauthorized`.

---

## 👥 Aba Usuários

### Lista de usuários

Colunas: Nome, Email, Role, Status, Último acesso, Ações

```typescript
interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  active: boolean;
  last_seen: string | null;
}
```

**Ações por linha:**
- Alterar role (select inline: viewer / editor / admin)
- Suspender / Reativar (toggle com confirmação)

**Regra:** admin não pode suspender a si mesmo nem rebaixar seu próprio role.

### Formulário — Novo usuário

Campos obrigatórios:
- Nome completo
- Email
- Senha (gerada ou definida)
- Role inicial (viewer por padrão)

Ao criar:
1. Chama `POST /admin/users`
2. Supabase cria o usuário em `auth.users`
3. Cria registro em `profiles` com o role definido
4. Registra log `user_created`
5. Exibe confirmação e volta para a lista

---

## 📋 Aba Logs

### Filtros

```typescript
interface LogFilters {
  userId?: string;       // select com lista de usuários
  actions?: string[];    // multiselect com catálogo de ações
  startDate?: string;    // date picker
  endDate?: string;      // date picker
  platform?: string;     // web | ios | android | native
}
```

### Tabela

Colunas: Data/hora, Usuário, Ação, Recurso, Plataforma, IP

- Paginação: 50 registros por página
- Ordenação: mais recente primeiro (fixo)
- Botão "Exportar CSV" — aplica os filtros ativos

### Badge de ação por cor

```
login / logout          →  azul
login_failed            →  vermelho
model_create / edit     →  verde
model_delete            →  laranja
user_suspended          →  vermelho
role_changed            →  amarelo
admin_access            →  roxo
```

---

## 📊 Aba Métricas

### Cards de resumo (topo)

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Usuários ativos │  │ Ativos (30 dias)│  │ Cálculos total  │  │ Modelos cadast. │
│     hoje        │  │                 │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Gráficos

**Logins por dia — linha**
- Eixo X: últimos 30 dias
- Eixo Y: quantidade de logins
- Tooltip com valor exato ao hover

**Cálculos por usuário — barras horizontais**
- Top 10 usuários
- Ordenado do maior para o menor

### Lista — Modelos mais usados

Tabela simples: posição, nome do modelo, quantidade de usos

---

## 🔧 Hooks de Admin

```typescript
// hooks/useAdminUsers.ts
export function useAdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => { /* GET /admin/users */ };

  const createUser = async (data: CreateUserPayload) => {
    /* POST /admin/users */
    await fetchUsers(); // re-fetch após criação
  };

  const updateUser = async (id: string, data: UpdateUserPayload) => {
    /* PATCH /admin/users/:id */
    await fetchUsers();
  };

  return { users, isLoading, createUser, updateUser, refetch: fetchUsers };
}
```

```typescript
// hooks/useAdminLogs.ts
export function useAdminLogs(filters: LogFilters) {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  // re-fetch quando filtros ou página mudam
  useEffect(() => { fetchLogs(); }, [filters, page]);

  return { logs, total, page, setPage };
}
```

---

## 🎨 Componentes necessários

| Componente | Descrição |
|-----------|-----------|
| `UserTable` | Tabela com ações inline de role e status |
| `CreateUserModal` | Formulário de criação de usuário |
| `RoleSelect` | Select de role com confirmação |
| `SuspendToggle` | Toggle de status com confirmação |
| `LogTable` | Tabela de logs com badge de ação |
| `LogFilters` | Filtros com selects e date pickers |
| `ExportCsvButton` | Exporta logs filtrados |
| `MetricCard` | Card de resumo numérico |
| `LoginChart` | Gráfico de linha (logins por dia) |
| `UsageBarChart` | Gráfico de barras (uso por usuário) |
| `TopModelsList` | Lista de modelos mais acessados |

---

## ⚠️ Regras de Ouro

1. **Toda ação destrutiva tem confirmação** — suspender usuário, alterar role e excluir pedem confirmação antes de chamar a API
2. **Admin não pode se auto-suspender** — validar no frontend e no backend
3. **Feedback imediato** — toda ação exibe loading state enquanto aguarda resposta da API
4. **Erros da API são exibidos ao usuário** — nunca engolir erros silenciosamente no painel admin
5. **Re-fetch após mutação** — após criar/editar/suspender, sempre atualizar a lista
6. **Painel admin nunca usa dados em cache offline** — sempre busca dados frescos da API

---

## 📋 Checklist de implementação

### ✅ Implementado (Maio 2026)
- [x] Rotas /admin/* protegidas com useRequireAuth('admin')
- [x] Lista de usuários com role e status
- [x] Formulário de criação de usuário funcional
- [x] Alterar role via modal com confirmação
- [x] Suspender/reativar com toggle
- [x] Admin bloqueado de se auto-suspender

### ⚠️ Não Implementado (fora do escopo atual)
- [ ] Aba Logs (`/admin/logs`) — será adicionado quando solicitado no backlog
- [ ] Aba Métricas (`/admin/metrics`) — será adicionado quando solicitado no backlog

---

**Nota (Maio 2026):** As funcionalidades de Logs e Métricas não são necessárias para o estado atual da aplicação e serão implementadas apenas quando solicitadas explicitamente no backlog.
