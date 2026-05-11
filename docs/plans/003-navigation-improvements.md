# Backlog: Melhorias de Navegação

## Problema Identificado

 Atualmente, após o usuário fazer login no sistema, **sempre** é redirecionado para a tela de `/models`. Isso não é ideal quando:

- O usuário acessa a calculadora (IPU ou Calibração) antes de fazer login
- O usuário é admin e precisa acessar o painel admin
- O usuário quer usar a tela inicial (Home)

---

## Melhorias Propostas

### 1. Redirecionamento Inteligente pós-login

**Problema:** Login sempre redireciona para `/models`, independente de onde o usuário veio.

**Solução proposta:**
- Se o usuário tentou acessar uma rota protegida antes do login, redirecionar de volta para essa rota após autenticação
- Se o usuário acessou `/login` diretamente, redirecionar para:
  - `/admin/users` se for admin
  - `/models` se for editor/viewer
- Armazenar a rota original no sessionStorage antes de redirecionar para login

**Arquivos afetados:**
- `app/login.tsx` — redirecionamento após login
- `src/hooks/useRequireAuth.ts` — salvar rota original

**Prioridade:** Alta

---

### 2. Melhoria na Navegação do Admin

**Problema:** Usuário admin não tem acesso rápido ao painel admin após login.

**Solução proposta:**
- Adicionar link direto para `/admin` no menu ou header quando o usuário for admin
- Na Home Screen, mostrar botão "Painel Admin" apenas para usuários com role `admin`
- Adicionar breadcrumb ou tabs para navegar entre as abas do admin (Users, Logs, Metrics)

**Arquivos afetados:**
- `src/features/home/screens/HomeScreen.tsx` — botão admin condicional
- `app/admin/users/index.tsx` — adicionar navegação para outras abas

**Prioridade:** Média

---

### 3. Menu Hamburger Global

**Problema:** Navegação entre telas principais (Home, Calculadora, Calibração, Modelos) requer voltar para Home sempre. O ícone de engrenagem não é intuitivo.

**Solução proposta:**
- Substituir o ícone de engrenagem por um **menu hamburger** (drawer/sidebar)
- O menu fica disponível em **todas as telas** (via `_layout.tsx`)
- Incluir:
  - Info do usuário logado (nome, role)
  - Links de navegação: Home, Injeção (IPU), Calibração, Modelos
  - Se admin: link para Painel Admin
  - Logout
  - Versão do app

**Arquivos afetados:**
- `app/_layout.tsx` — integrar Drawer/NavigationMenu
- Novo componente `src/components/NavigationMenu.tsx`
- Remover `src/features/home/screens/HomeScreen.tsx` (ícone de engrenagem)

**Prioridade:** Alta (substitui a engrenagem + resolve navegação)

**Mockup:**

```
┌─────────────────────┐
│  ☰ IPU Calculator   │
├─────────────────────┤
│ 👤 João (Admin)     │
├─────────────────────┤
│ 🏠 Início           │
│ 💉 Injeção (IPU)    │
│ 📏 Calibração       │
│ 📁 Modelos          │
├─────────────────────┤
│ ⚙️ Painel Admin     │ ← só para admin
├─────────────────────┤
│ 🚪 Sair             │
└─────────────────────┘
```

---

### 4. Proteção de Rotas com Feedback

**Problema:** Quando usuário não autenticado tenta acessar rota protegida, é redirecionado abruptamente para `/login`.

**Solução proposta:**
- Na rota protegida, verificar autenticação com `useRequireAuth`
- Se não autenticado, mostrar toast ou modal explicando por que está sendo redirecionado
- Oferecer opção de "Fazer login" ou "Voltar para Home"

**Arquivos afetados:**
- `src/hooks/useRequireAuth.ts` — adicionar feedback visual

**Prioridade:** Baixa

---

## Checklist de Implementação

- [ ] Implementar redirecionamento inteligente pós-login
- [ ] Implementar menu hamburger global
- [ ] Remover ícone de engrenagem da Home
- [ ] Melhorar feedback de redirecionamento quando não autenticado

---

## Ordem de Implementação Sugerida

1. **Prioridade Alta:** Menu hamburger global (substitui engrenagem)
2. **Prioridade Alta:** Redirecionamento inteligente pós-login
3. **Prioridade Baixa:** Feedback de redirecionamento

---

## Referências

- `docs/skill/authentication_protocol.md` — fluxo de autenticação
- `docs/autentication/skill/admin_panel_protocol.md` — estrutura do painel admin
- `app/login.tsx` — tela de login atual