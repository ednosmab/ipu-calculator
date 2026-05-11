# Guia Técnico: Fluxo de Consulta Admin (Edge Functions + Auth)

Este documento descreve o processo de ponta a ponta para recuperar dados sensíveis (como a lista de usuários) garantindo segurança e integridade.

## 1. Arquitetura de Comunicação

O fluxo segue este caminho:
`Frontend (UI)` → `API Client (fetchWithAuth)` → `Supabase Edge Function` → `Banco de Dados (Service Role)`

---

## 2. Passo a Passo do Processo

### Passo 1: Solicitação no Frontend
No arquivo `app/admin/users/index.tsx`, o hook `useAdminUsers` é chamado. Ele gerencia o estado da lista e o estado de carregamento.

### Passo 2: O Cliente de API (`edgeFunctionsClient.ts`)
Para falar com as Edge Functions, usamos o `fetchWithAuth`. Ele resolve o problema mais comum do Supabase: **Headers de Autenticação**.
- **JWT**: O token do usuário logado é inserido no header `Authorization`.
- **API Key**: A `EXPO_PUBLIC_SUPABASE_ANON_KEY` é inserida no header `apikey`. Sem ela, o Supabase bloqueia a requisição antes mesmo dela chegar na função.

### Passo 3: Validação na Edge Function (`authMiddleware.ts`)
Dentro da função (ex: `admin-users`), o middleware `requireAuth` faz o seguinte:
1. Valida se o token JWT é válido.
2. Busca o perfil do usuário no banco usando a `SERVICE_ROLE_KEY`.
3. Verifica se o campo `role` é igual a `admin`.
4. Verifica se o campo `active` é `true`.

### Passo 4: Acesso a Dados Protegidos (Bypass de RLS)
Como o e-mail dos usuários fica na tabela `auth.users` (esquema interno do Supabase), um cliente normal não consegue lê-los.
- A Edge Function cria um cliente interno com a `SUPABASE_SERVICE_ROLE_KEY`.
- Esta chave permite usar `supabase.auth.admin.listUsers()`, que retorna os dados de autenticação de todos os usuários.

### Passo 5: Resposta e CORS
A função agrupa os dados do perfil (nome, cargo) com os dados de autenticação (e-mail) e retorna um JSON. O helper `handleCors` garante que o navegador (ou app) aceite a resposta.

---

## 3. Guia de Sobrevivência (Dificuldades Comuns)

### "Sempre dá problema no Auth"
- **Causa 1: Token expirado.** O `sessionStorage.getToken()` garante que estamos pegando o token mais recente.
- **Causa 2: RLS bloqueando.** Se você tentar usar o cliente padrão do Supabase no frontend para ler outros usuários, o RLS vai bloquear. **Sempre use Edge Functions para tarefas de Admin.**
- **Causa 3: Service Role Key ausente.** No painel do Supabase, verifique se as "Secrets" da Edge Function contêm a `SUPABASE_SERVICE_ROLE_KEY`.

### "Trabalhar com Edge Functions é difícil"
- **Dica:** Use o comando `supabase functions serve` para testar localmente.
- **Dica:** Sempre use o helper `ok()` e `err()` que criamos em `_shared/response.ts` para manter as respostas padronizadas.

---

## 4. Arquivos Relacionados
- `src/core/api/edgeFunctionsClient.ts` (O motor das chamadas)
- `supabase/functions/admin-users/index.ts` (A lógica do servidor)
- `supabase/functions/_shared/authMiddleware.ts` (A segurança)
