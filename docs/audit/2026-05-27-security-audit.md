# Auditoria de Código — ipu-calculator
**Versão analisada:** 1.2.17  
**Data:** 27/05/2026  
**Stack:** React Native + Expo Router · Supabase Edge Functions (Deno) · PostgreSQL RLS · PWA

---

## Resumo Executivo

O projeto está bem estruturado e demonstra maturidade arquitetural considerável: separação em camadas (domain / application / infra), design system próprio, sistema offline com sync otimista, auditoria de acessos e RBAC no backend. Porém foram identificadas **5 vulnerabilidades de segurança**, **3 problemas de arquitetura/inconsistência** e **5 melhorias de qualidade** que precisam de atenção, algumas delas críticas.

---

## 🔴 Vulnerabilidades de Segurança

### 1. Edge Functions de debug sem autenticação (CRÍTICO)

**Arquivos:** `supabase/functions/debug-env/`, `debug-insert/`, `debug-profile/`, `fix-profile/`, `check-users/`

Todas essas cinco funções são acessíveis publicamente sem nenhuma verificação de token ou role. Os danos possíveis são graves:

- `debug-env` expõe se a `SERVICE_ROLE_KEY` está configurada e seu prefixo — suficiente para confirmar a chave e orientar ataques.
- `debug-insert` insere um perfil com UUID hardcoded (`a41d5d1d...`) diretamente no banco, sem autenticação.
- `fix-profile` promove qualquer `userId` ao role `admin` via POST sem verificação alguma.
- `check-users` lista todos os usuários autenticados do sistema.
- `debug-profile` aceita qualquer e-mail e retorna o perfil completo do usuário correspondente.

**Solução imediata:** Adicionar `requireAuth(req, 'admin')` no início de cada uma. A médio prazo, remover essas funções de produção ou colocá-las atrás de uma variável de ambiente que as desabilite fora de desenvolvimento.

---

### 2. Email do usuário logado no console em produção (ALTO)

**Arquivo:** `src/core/auth/AuthProvider.tsx`, linha 145

```ts
console.log(`[AuthProvider] signIn — email: ${email}`)
```

O e-mail do usuário é logado em texto claro no console do cliente. Em ambientes PWA e React Native, esses logs podem ser capturados por ferramentas de debug (Expo DevTools, Sentry breadcrumbs, ferramentas de teste), expostos em crash reports ou visíveis em sessões de screen recording. O mesmo vale para o log do status da resposta de login na linha seguinte.

**Solução:** Remover ou substituir por uma versão mascarada (`email.replace(/(?<=.).(?=[^@]*@)/g, '*')`), e garantir que logs de produção sejam controlados por flag de ambiente (`__DEV__`).

---

### 3. Prefixo do token JWT exposto nos logs (MÉDIO)

**Arquivo:** `src/core/api/edgeFunctionsClient.ts`, linha 30

```ts
tokenPrefix: token ? token.substring(0, 20) + '...' : 'NONE',
```

Os primeiros 20 caracteres de um JWT são expostos em cada chamada a uma Edge Function. Embora o header e parte do payload sejam base64 padrão, isso facilita correlação e possibilita ataques de força bruta em tokens curtos. Basta logar `hasToken: !!token`.

---

### 4. CORS permissivo para todos os subdomínios `.vercel.app` (MÉDIO)

**Arquivo:** `supabase/functions/_shared/cors.ts`

```ts
if (origin.endsWith('.vercel.app')) {
  // permite qualquer preview branch da Vercel
}
```

Qualquer pessoa que faça deploy de qualquer projeto na Vercel com um subdomínio `.vercel.app` pode realizar chamadas autenticadas às Edge Functions do sistema. Isso elimina a proteção de origem para todas as branch previews e projetos de terceiros hospedados na Vercel.

**Solução:** Substituir pela allowlist explícita de origens configuradas via variável de ambiente, ou aceitar apenas o padrão de prefixo do projeto (`ipu-calculator-*.vercel.app`).

---

### 5. `auth-login` retorna a sessão completa do Supabase (BAIXO)

**Arquivo:** `supabase/functions/auth-login/index.ts`

A função retorna `data.session` inteiro para o cliente, o que inclui o `refresh_token`. O `AuthProvider` porém autentica diretamente pelo endpoint `/auth/v1/token` (não pela edge function `auth-login`), então a edge function de login ficou sem uso efetivo no fluxo atual — mas caso volte a ser usada, expor o refresh token amplia a superfície de ataque.

---

## 🟡 Problemas de Arquitetura e Consistência

### 6. Dois sistemas de autenticação paralelos (ALTO)

O projeto possui dois caminhos de autenticação que coexistem de forma inconsistente:

- **`AuthProvider.signIn`** autentica diretamente contra `/auth/v1/token` (endpoint público do Supabase), fazendo bypass completo da Edge Function `auth-login`.
- **`supabase/functions/auth-login`** existe como uma Edge Function completa com audit log, criação de perfil automática e bloqueio de conta suspensa — mas nunca é chamada pelo frontend.

Isso significa que o audit log de login (`action: 'login_success'`) nunca é registrado, a criação automática de perfil na Edge Function nunca ocorre pelo fluxo normal, e existe dead code de backend.

**Solução:** Decidir por um único fluxo. O recomendado é chamar a Edge Function `auth-login` no `signIn` do `AuthProvider`, e remover o acesso direto ao endpoint do Supabase.

---

### 7. Modelos sem controle de ownership (MÉDIO)

**Arquivos:** `supabase/functions/models-delete/`, `models-sync/`, `models-get/`

A tabela `models` não possui coluna `user_id` ou `created_by`. Qualquer usuário com role `editor` pode deletar ou sobrescrever modelos criados por outros editores. O `models-get` retorna todos os modelos do sistema sem filtragem por usuário. Isso pode ou não ser intencional (modelos compartilhados entre toda a equipe), mas não há documentação justificando essa escolha.

**Ação:** Se modelos são globais/compartilhados, documentar explicitamente. Se devem ser por usuário, adicionar coluna `created_by uuid REFERENCES auth.users` e filtrar nas queries.

---

### 8. Fallback de perfil com role mínimo silencioso (BAIXO)

**Arquivo:** `src/core/auth/AuthProvider.tsx`, função `fetchProfile`

Quando o perfil não é encontrado nem via REST nem via `auth-validate`, o sistema cria silenciosamente um perfil local com `role: 'viewer'`. Isso é correto do ponto de vista de segurança (princípio do menor privilégio), mas não notifica o usuário nem o administrador. Um usuário com perfil ausente no banco verá a interface como `viewer` sem entender o porquê, e o bug passa despercebido.

---

## 🔵 Qualidade e Boas Práticas

### 9. Rate limiting no login não implementado

**Arquivo:** `supabase/functions/__tests__/auth-login-rate-limit.test.ts`

O arquivo de teste de rate limiting contém apenas comentários com `TODO`. O endpoint de login não tem nenhuma proteção contra brute force — qualquer atacante pode tentar combinações de senha indefinidamente.

**Solução:** Implementar rate limiting por IP e por e-mail no `auth-login`. O Supabase suporta integração com Upstash Redis para contadores distribuídos.

---

### 10. URL do Supabase hardcoded no código-fonte

**Arquivo:** `src/core/config.ts`

```ts
SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://uqihnpwpcrujqycbuzxv.supabase.co',
```

O ID do projeto Supabase (`uqihnpwpcrujqycbuzxv`) está exposto no repositório como fallback. Isso não é uma chave secreta, mas facilita ataques direcionados ao projeto. O fallback hardcoded também oculta configurações incorretas de variável de ambiente.

**Solução:** Remover o fallback e lançar um erro explícito se a variável não estiver definida. O mesmo vale para `EDGE_FUNCTIONS_URL`.

---

### 11. `supabaseClient.ts` usa `AsyncStorage` para sessão nativa

**Arquivo:** `src/core/infra/supabaseClient.ts`

O cliente Supabase instanciado nesse arquivo usa `AsyncStorage` como storage de sessão, enquanto o `sessionStorage.ts` usa corretamente `expo-secure-store` para tokens sensíveis. O arquivo `supabaseClient.ts` aparentemente só é usado para realtime (subscriptions), mas o risco é que alguém adicione no futuro operações autenticadas via esse cliente, armazenando tokens em AsyncStorage não-criptografado.

**Solução:** Adicionar um comentário claro de que esse cliente é somente para realtime/sem auth, ou alinhar o storage com `expo-secure-store`.

---

### 12. `update` no modelRepository adiciona operação pendente duplicada

**Arquivo:** `src/features/models/infra/modelRepository.ts`

Na função `update`, o modelo já é marcado com `syncStatus: 'pending'` e imediatamente enviado para sync via `_handleBackgroundSync`. Mas a função também adiciona uma operação pendente via `pendingOpsService.addPendingEdit`. Se o sync em background falhar, existirão dois registros de "operação pendente" para o mesmo modelo. A função `create` não faz o mesmo (não chama `addPendingEdit`), criando comportamento assimétrico.

---

### 13. Service Worker notifica `SW_UPDATED` sem confirmação do cliente

**Arquivo:** `public/service-worker.js`

No evento `activate`, o SW chama `self.registration.update()` e depois notifica todos os clientes com `SW_UPDATED`. Esse fluxo é executado em todo activate, não apenas quando há uma nova versão, gerando notificações falsas de atualização para o usuário a cada recarga de página em alguns navegadores.

---

## Sumário de Prioridades

| # | Severidade | Item |
|---|-----------|------|
| 1 | 🔴 Crítico | Edge Functions de debug sem autenticação |
| 2 | 🔴 Alto | Email do usuário em `console.log` em produção |
| 6 | 🟡 Alto | Dois sistemas de autenticação paralelos |
| 3 | 🟡 Médio | Prefixo de token JWT nos logs |
| 4 | 🟡 Médio | CORS permissivo para todos os `.vercel.app` |
| 7 | 🟡 Médio | Modelos sem controle de ownership |
| 9 | 🟡 Médio | Rate limiting de login não implementado |
| 5 | 🔵 Baixo | `auth-login` retorna sessão completa (refresh token) |
| 8 | 🔵 Baixo | Fallback de perfil silencioso |
| 10 | 🔵 Baixo | URL do Supabase hardcoded como fallback |
| 11 | 🔵 Baixo | `supabaseClient.ts` usa AsyncStorage para tokens |
| 12 | 🔵 Baixo | Operações pendentes duplicadas no `update` |
| 13 | 🔵 Baixo | Service Worker notifica update incorretamente |

---

## O que está bem feito

Para o registro, o projeto acerta em vários pontos importantes:

- RLS corretamente habilitado em todas as tabelas com policies por role.
- Middleware `requireAuth` centralizado e reutilizado em todas as Edge Functions de produção.
- Mutex simples mas eficaz (`writeQueue`) no `modelRepository` para evitar race conditions em escritas concorrentes.
- Auditoria de acessos (`access_logs`) com fire-and-forget, não bloqueando o fluxo principal.
- Proteção contra auto-suspensão e auto-deleção de admin nas funções de gerenciamento de usuários.
- `sessionStorage.ts` usa `expo-secure-store` para nativo e `window.sessionStorage` (não `localStorage`) para web — escolha correta.
- Validação de schema com Zod tanto no cliente quanto no servidor.
- Proteção de rota `useRequireAuth` com suporte a role mínimo e fallback offline controlado.

---

## 🔧 Checklist de Verificação Pós-Correção (Maio 2026)

### Fase 1 — Debug functions
- [ ] `curl -X POST <project>.supabase.co/functions/v1/fix-profile` → 404
- [ ] `curl <project>.supabase.co/functions/v1/debug-env` → 404
- [ ] `curl <project>.supabase.co/functions/v1/check-users` → 404

### Fase 2 — Logs sensíveis
- [ ] Fazer login e verificar que console não exibe e-mail do usuário
- [ ] Erros de login ainda aparecem no console (sem e-mail)

### Fase 3 — Unificação de auth
- [ ] Login com credenciais válidas funciona
- [ ] `access_logs` tem registro `login` para o novo login

### Fase 4 — Rate limiting
- [ ] 6 tentativas falhas seguidas → 6ª retorna 429
- [ ] Após 60s, reset e aceita nova tentativa

### Fase 5 — CORS
- [ ] App em produção (`ipu-calculator.vercel.app`) funciona
- [ ] OPTIONS de `outro-projeto.vercel.app` rejeitado
