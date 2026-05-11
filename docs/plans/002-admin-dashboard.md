# Plano: Painel Admin - Gestão de Usuários

## Objetivo

Habilitar a criação de novos usuários e definição de nível de acesso (role) através do painel admin.

---

## Verificação Prévia

### 1. Estrutura da Tabela profiles (Supabase)

A tabela `public.profiles` já possui o campo `role` com suporte a três níveis:

```sql
-- Fonte: supabase/migrations/001_auth_security.sql (linha 14-15)
role text NOT NULL DEFAULT 'viewer'
  CHECK (role IN ('admin', 'editor', 'viewer'))
```

| Role | Descrição |
|------|-----------|
| `admin` | Acesso total ao painel admin e gestão de usuários |
| `editor` | Pode criar/editar/excluir modelos |
| `viewer` | Apenas visualiza modelos (acesso mínimo) |

---

## Status de Implementação

### ✅ Implementado e Testado (Staging)

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/001_auth_security.sql` | Tabela profiles com campo role |
| `supabase/functions/admin-users/index.ts` | Edge Function GET (lista) + POST (cria) |
| `supabase/functions/admin-users-update/index.ts` | Edge Function PATCH (atualiza role/status) |
| `src/hooks/admin/useAdminUsers.ts` | Hook com createUser, updateUser, fetchUsers |
| `app/admin/users/index.tsx` | Tela de gestão de usuários |
| `src/components/admin/UserTable.tsx` | Tabela com ações inline |
| `src/components/admin/CreateUserModal.tsx` | Modal de criação (parcial) |

**Status Staging: ✅ CONCLUÍDO**
- Login funciona corretamente
- Lista de modelos carrega
- Criação de novo modelo funciona
- Aguardando teste de produção

### ✅ Concluído (Maio 2026)

| Item | Status |
|------|--------|
| CreateUserModal | ✅ Seletor de role interativo (botões) |
| Teste de criação | ✅ Criado e logou com sucesso |
| Teste de atualização | ✅ Alteração de role funciona |

---

## Tarefas de Implementação

### Tarefa 1: Corrigir seletor de role no CreateUserModal

**Arquivo:** `src/components/admin/CreateUserModal.tsx`

**Problema atual:** O componente mostra as opções de role como texto, sem interação.

**Solução:** Substituir o `View` estático por um componente de seleção interativo (Toggle ou similar).

```tsx
// Implementar como um Toggle ou Select
<DSText style={styles.label}>Nível de acesso</DSText>
<HStack>
  {['viewer', 'editor', 'admin'].map(role => (
    <Button
      key={role}
      title={roleLabels[role]}
      variant={form.role === role ? 'primary' : 'secondary'}
      onPress={() => setForm(prev => ({ ...prev, role }))}
    />
  ))}
</HStack>
```

### Tarefa 2: Testar criação de usuário

1. Fazer build local:
   ```bash
   npm run build
   npx serve dist -l 3000
   ```

2. Fazer login como admin

3. Acessar `/admin/users`

4. Clicar em "Novo usuário"

5. Preencher formulário e criar

6. Verificar se Edge Function é chamada corretamente

### Tarefa 3: Testar atualização de role/status

1. Na lista de usuários, clicar no role atual

2. Selecionar novo role

3. Verificar se atualização é refletida na lista

4. Testar toggle de status (ativar/desativar)

---

## 📝 Observação — Funcionalidades não Implementadas

As seguintes funcionalidades **não serão implementadas** nesta versão, pois não são necessárias para o estado atual da aplicação:

- Aba Logs (`/admin/logs`) — filtros, tabela de logs, exportar CSV
- Aba Métricas (`/admin/metrics`) — cards, gráficos, lista de modelos mais usados

Essas funcionalidades serão adicionadas **apenas quando solicitadas** no backlog do projeto.

---

## Variáveis de Ambiente Necessárias

```bash
# Frontend (.env.local)
EXPO_PUBLIC_EDGE_FUNCTIONS_URL=https://uqihnpwpcrujqycbuzxv.supabase.co/functions/v1
```

**Nota:** Esta variável deve estar configurada no painel da Vercel para staging e production.

---

## Checklist de Verificação

- [ ] Tabela profiles tem campo role com CHECK constraint
- [ ] CreateUserModal tem seletor de role funcional
- [ ] POST /admin-users cria usuário com role definido
- [ ] PATCH /admin-users-update atualiza role
- [ ] PATCH /admin-users-update atualiza active (suspender/reativar)
- [ ] Admin não pode se auto-suspender
- [ ] Logs são registrados em access_logs

---

## Fluxo de Teste

```
1. Admin faz login
2. Acessa /admin/users
3. Clica "Novo usuário"
4. Preenche: nome, email, senha
5. Seleciona role: viewer/editor/admin
6. Clica "Criar usuário"
7. Usuário aparece na lista com role correto

8. No card do usuário:
9. Clica no role → abre menu de seleção
10. Altera role → atualiza no banco
11. Toggle active → suspende/reativa usuário

12. Usuário criado faz login
13. Verifica acesso conforme role
```

---

## Arquivos de Referência

- `docs/autentication/skill/admin_panel_protocol.md` — Protocolo completo do painel admin
- `docs/autentication/skill/rbac_protocol.md` — Hierarquia e validação de roles
- `docs/autentication/sumary/fase3-frontend-summary.md` — Resumo da implementação frontend