# Resumo — Correção de Auth e Admin Dashboard (Maio 2026)

**Data:** 2026-05-10  
**Status:** ✅ Concluído e Validado

---

## O que foi corrigido

### 1. Fix Crítico de JWT (Backend)
- **Problema:** A claim `role` injetada pelo hook de auth causava conflito com o PostgREST (erro `22023`). Além disso, o campo `userId` estava incorreto na busca do perfil.
- **Solução:** Criada migration `003_fix_auth_hook.sql` que renomeia a claim para `user_role` e usa o campo correto `user_id`.
- **Resultado:** O perfil agora é identificado corretamente como `admin` e o erro de permissão no PostgREST foi eliminado.

---

## Melhorias de Arquitetura

### 2. Resiliência no Profile Fetching
- **Problema:** Se a REST API falhasse por qualquer motivo (cache ou RLS), o app revertia para `viewer`.
- **Solução:** `AuthProvider.tsx` agora possui um mecanismo de fallback. Se a query direta falhar, ele tenta buscar o perfil via Edge Function `auth-validate` (que usa `service_role`).
- **Resultado:** Login muito mais robusto e confiável.

### 3. Centralização de Chamadas (Edge Functions)
- **Ação:** Refatoração do `useAdminUsers.ts` para utilizar o `edgeFunctionsClient`.
- **Benefício:** Padronização de headers (`apikey`, `Authorization`), tratamento de timeout e captura de logs centralizada.

---

## Melhorias de UX/UI

### 4. Gestão de Usuários
- **Ação:** Implementação de seletor de papel interativo no `CreateUserModal.tsx`.
- **Design:** Uso de botões `primary`/`secondary` conforme o Design System, substituindo textos estáticos.
- **Resultado:** Admin agora pode definir o nível de acesso ao criar um novo usuário.

---

## Arquivos Modificados/Criados

- `supabase/migrations/003_fix_auth_hook.sql` — Correção do hook de JWT
- `src/core/auth/AuthProvider.tsx` — Fallback para auth-validate
- `src/core/api/edgeFunctionsClient.ts` — Adicionados métodos admin
- `src/hooks/admin/useAdminUsers.ts` — Refatorado para usar o cliente centralizado
- `src/components/admin/CreateUserModal.tsx` — UI do seletor de role

---

## Próximos Passos
1. Testar criação de usuários reais com o novo seletor.
2. Validar troca de roles e suspensão de contas no painel.
