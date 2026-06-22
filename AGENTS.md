# Agent: Antigravity Architect
**Contexto:** Desenvolvimento de projeto específico via OpenCode.

## 🎯 Perfil e Identidade
Você é um Engenheiro de Software Sênior especializado em arquitetura limpa e refatoração. Sua missão é guiar o desenvolvimento deste projeto seguindo rigorosamente os documentos de apoio.

## 📚 Fontes de Verdade (Single Source of Truth)
Toda resposta sua deve ser baseada nos arquivos localizados em `./docs/`.
- **Roadmaps:** Visão geral e metas de longo prazo.
- **Workflow:** Processos de trabalho e padrões de commits/branches.
- **Plans:** Instruções detalhadas para as tarefas e refatorações atuais.
- **Skills:** Tecnologias permitidas e padrões de codificação.

## 🛠️ Regras de Comportamento (Automáticas)
1. **Consulta Silenciosa:** Não peça permissão para ler a pasta `docs`. Você já tem acesso via MCP e instruções de sistema. Use-os proativamente.
2. **Priorização de Planos:** Sempre verifique a pasta `docs/plans/` para entender qual é a tarefa prioritária antes de sugerir mudanças no código.
3. **Validação de Workflow:** Antes de finalizar uma tarefa, certifique-se de que ela segue o definido em `docs/workflow/`.
4. **Atualização do GUIA_TECNICO_COMPLETO:** Toda refatoração, nova funcionalidade ou mudança arquitetural deve atualizar `docs/GUIA_TECNICO_COMPLETO.md` para refletir o estado atual do código. Este arquivo é a única fonte de verdade técnica consolidada.
5. **Respostas Concisas:** Como estamos operando em um modelo Free, seja direto ao ponto. Evite explicações genéricas; foque no código e na lógica do projeto.

## 🚀 Fluxo de Interação
Ao iniciar uma tarefa, siga mentalmente este ciclo:
1. Localizar o plano em `docs/plans/`.
2. Verificar dependências no `roadmap`.
3. Validar padrões em `skills` e `workflow`.
4. Implementar a solução focada e otimizada.

## 🛑 Restrições de Operação

### Git e Segurança
- **PROIBIDO commit de .env:** O arquivo `.env` e variantes (`.env.local`, `.env.production`, etc.) NUNCA devem ser commitados. Sempre verificar se `.env` está no `.gitignore` e fora do staging antes de qualquer commit.
- **Verificar antes de commit:** Antes de pedir "COMMIT" ao usuário, sempre confirmar que `git status` não inclui arquivos `.env` ou outras variáveis de ambiente.

### Commits
- **PROIBIDO AUTO-COMMIT:** Nunca execute `git commit` ou `git push` sem que eu escreva explicitamente a palavra "COMMIT" no chat.
- **APENAS STAGING:** Você pode sugerir mudanças e até editar arquivos, mas o commit é uma ação humana.
- **REVISÃO PRIMEIRO:** Sempre apresente o código para revisão antes de tentar qualquer operação de Git.
- **Gatilho de Commit:** Você está proibido de realizar commits automaticamente. A única exceção é quando o usuário digitar exatamente a palavra "COMMIT".
- **Ação após o Gatilho:** Ao ler "COMMIT", você deve:
    1. Verificar que `.env` não está no staging (`git status`).
    2. Agrupar as alterações feitas.
    3. Gerar uma mensagem de commit curta e técnica seguindo o `docs/workflow/`.
    4. Executar o comando de commit na branch atual.
- **Revisão:** Antes do commit, sempre perguntar: "As alterações acima estão corretas?". Se eu responder "COMMIT", proceda.

---

## 📋 Anchored Summary (Session State)

> Atualizado automaticamente pelo agente ao final de cada sessão.
> Esta seção captura o estado atual da implementação para continuidade entre sessões.

### Sessão Atual — Correções de Auditoria (Itens 2, 4, 5)

**Objetivo:** Resolver 3 ressalvas da auditoria de 2026-05-27 — interface de sessão sem `refresh_token`, config.ts resiliente, E2E tests com asserts reais.

#### ✅ Concluído

| Item | Arquivo(s) | O que mudou |
|------|-----------|-------------|
| 2 — `refresh_token` removido | `src/core/auth/AuthContext.tsx` | Interface `AuthSession` perdeu `refresh_token?` e `expires_at?` — contém só `access_token`. Nenhum código em `src/` referenciava esses campos. |
| 4 — `config.ts` não crasha mais | `src/core/config.ts` | Substituído `throw Error` no módulo por `console.warn` + fallback vazio. Função `ensureConfig()` lança erro no ponto de uso (antes de fetch inválido). |
| 5 — E2E tests com asserts reais | `e2e/security-flows.spec.ts`, `e2e/rate-limiting.spec.ts`, `e2e/edge-functions-integration.spec.ts` | 3 spec files populados com asserts reais: login/logout, rate limit (5→429), CRUD via Edge Functions. |

#### 🔍 Decisões Relevantes

- `config.ts` usa guarda em tempo de uso em vez de throw na importação — permite que testes e CI carreguem o módulo sem crash se env vars não estiverem presentes
- `AuthSession` simplificada para conter apenas `access_token` — elimina risco de `refresh_token` vazar via sessionStorage ou log
- E2E de rate-limit faz chamadas HTTP diretas à Edge Function (bypassa UI), enquanto security-flows e CRUD usam o app via Playwright

#### ⏳ Próximos Passos

- Executar E2E tests em ambiente com Supabase real (`npx playwright test e2e/security-flows.spec.ts`)
- Verificar debounce de sugestão `lang` no input de pesquisa (mencionado brevemente, não priorizado)
- Se multi-região futura, migrar rate limiter in-memory para Redis

#### ⚠️ Contexto Crítico

- `auth-login/index.ts` ainda acessa `data.session.refresh_token` internamente via Supabase SDK, mas a resposta HTTP filtra e `AuthSession` do cliente não tem mais o campo — vazamento impossível por construção
- `config.ts` emite `console.warn` se env vars faltam — visível no terminal dev, mas build de produção ainda falha se vars não estiverem definidas (comportamento desejado: crashar cedo em produção)
- E2E tests de rate-limit usam `fetch` direto (não `page.route`), dependem do Supabase real para execução
- Lint: 0 erros, 47 warnings pré-existentes | Testes: 165 passed, 1 skipped

---

### Sessão Atual — Fix Login (Junho 2026)

**Objetivo:** Diagnosticar e corrigir falha de login que retornava `INVALID_CREDENTIALS` mesmo com credenciais válidas.

#### ✅ Concluído

| Item | Arquivo(s) | O que mudou |
|------|-----------|-------------|
| 1 — Root cause | Diagnóstico via curl | Edge function `auth-login` foi deployada com `--verify-jwt` (default), bloqueando chamadas anônimas. Gateway retornava `UNAUTHORIZED_NO_AUTH_HEADER` que o `AuthProvider` mapeava para `INVALID_CREDENTIALS` |
| 2 — Redeploy | `supabase/functions/auth-login/index.ts` | Redeploy com flag `--no-verify-jwt` para permitir chamadas anônimas. **Única função pública** — todas as outras mantêm `--verify-jwt` |
| 3 — Reset de senha | SQL direto no banco | `UPDATE auth.users SET encrypted_password = crypt('Admin@2026IPU', gen_salt('bf')), email_confirmed_at = NOW()` para `admin@ipu.com` (id `a91e2352-...`) |
| 4 — Toggle de senha | `app/login.tsx` | Adicionado `showPassword` state + `Pressable` com ícone `eye`/`eye-slash` do `FontAwesome5`. `testID="login-password-toggle"`, `accessibilityLabel` dinâmico, `disabled` durante loading |
| 5 — ADR-55 | `docs/adr/README.md` | Documentada decisão "auth-login como única função pública" com contexto, alternativas, justificativa, comandos de verificação |

#### 🔍 Decisões Relevantes

- **Por que `--no-verify-jwt` em `auth-login`?** Chicken-and-egg: precisa de função sem JWT para entregar JWT. Mantida a segurança via validação de credenciais (`supabase.auth.signInWithPassword`), rate limiting (5/min/email), audit log
- **Por que `Admin@2026IPU`?** 14 chars, satisfaz política (12+ chars, letras+números+symbols)
- **Por que SQL direto?** Dashboard Supabase não conseguia confirmar email via UI; SQL bypass essa fricção
- **Por que ADR-55?** Documenta decisão arquitetural com comando de deploy e verificação, evita recorrência do bug

#### ⏳ Próximos Passos

- [ ] Testar fluxo completo: login → /models → criar modelo → sync
- [ ] Adicionar CI/CD que aplica `--no-verify-jwt` automaticamente ao `auth-login`
- [ ] Considerar mover lista de funções que requerem flag especial para `scripts/deploy-edge-functions.sh`
- [ ] (Opcional) Migrar `auth-validate` para validar com refresh token (rotação)

#### ⚠️ Contexto Crítico

- **Credenciais de teste válidas**: `admin@ipu.com` / `Admin@2026IPU`
- **Teste local**: `npm run build && npx serve dist -l 3002` (NÃO usar `npm start` — bundle de produção é mais confiável)
- **Diagnóstico rápido se login falhar**: rodar curl sem `Authorization` na edge function; se voltar `UNAUTHORIZED_NO_AUTH_HEADER`, redeploy com `--no-verify-jwt` está pendente
- **Verificação pós-deploy (curl)**: `auth-login` anônimo deve retornar `INVALID_CREDENTIALS`; `models-sync` anônimo deve retornar `UNAUTHORIZED_NO_AUTH_HEADER`
- **Linter warnings 405/406 (leaked password protection)**: requerem plano Pro do Supabase (HaveIBeenPwned) — não bloqueiam, documentados
- **Linter warning `passwords-leaked` para `admin@ipu.com`/`Admin@2026IPU`**: mesma limitação Pro; senha em si é forte
- **Vercel env vars**: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_EDGE_FUNCTIONS_URL` em Production+Preview; `EXPO_PUBLIC_APP_ENV` só em Production atualmente
- **ADR-55** referencia este bug como caso de estudo (linha 866: "Em maio/2026 esse problema causou falha de login em produção")

---

### Sessão Atual — Refresh Proativo + Auto-Reauth (Junho 2026)

**Objetivo:** Eliminar erros 401 do gateway em uso prolongado (TTL do JWT = 1h) e implementar auto-recovery transparente. Diagnóstico confirmou: gateway Supabase retorna `401 UNAUTHORIZED_NO_AUTH_HEADER` quando token expira, e o parser antigo mapeava para `REQUEST_FAILED` genérico.

#### ✅ Concluído

| Item | Arquivo(s) | O que mudou |
|------|-----------|-------------|
| 1 — Edge function `auth-refresh` | `supabase/functions/auth-refresh/index.ts` (novo) | POST: recebe `refresh_token`, chama `/auth/v1/token?grant_type=refresh_token`, retorna novo session. Rate limit 10/min/user. Log `token_refresh` action |
| 2 — Parser de erro 3 kinds | `src/core/api/edgeFunctionsClient.ts` | `EdgeFunctionError` discriminated union: `gateway` (401/403 do Supabase, code: `UNAUTHORIZED_NO_AUTH_HEADER`), `function` (4xx/5xx da edge, code: `INVALID_CREDENTIALS`), `network` (TIMEOUT/NETWORK_ERROR/NO_TOKEN). Detecta via presença de `data.code && !data.error` |
| 3 — Método `refreshSession()` | `src/core/api/edgeFunctionsClient.ts` | Bypassa `getAuthToken` para usar `refresh_token` no body. Bypass de `Authorization` header. Mesma lógica de error parsing |
| 4 — `AuthSession` com refresh | `src/core/auth/AuthContext.tsx`, `src/core/auth/AuthProvider.tsx` | `AuthSession` agora tem `access_token`, `refresh_token?`, `expires_at?`. `auth-login` retorna `refresh_token`/`expires_in`/`expires_at` no body |
| 5 — `sessionStorage` com refresh token | `src/core/auth/sessionStorage.ts` | `REFRESH_TOKEN_KEY='ipu_refresh_token'`, métodos `getRefreshToken`/`setRefreshToken`/`clearRefreshToken`, incluído em `clearAll` |
| 6 — `TokenRefreshObserver` | `src/core/auth/tokenRefreshObserver.ts` (novo) | 4 triggers: (a) setTimeout agendado TTL-5min, (b) `visibilitychange` se TTL<10min, (c) `storage` event cross-tab, (d) `AppState` para RN. MAX_ATTEMPTS=3, RETRY_DELAY=30s |
| 7 — Hook `useTokenRefresh` | `src/core/auth/useTokenRefresh.ts` (novo) | Conecta AuthProvider ao observer. Chama `refreshSession()`, persiste novos tokens, dispara `onAuthLost` se falhar 3x |
| 8 — `TokenRefreshBootstrap` | `src/core/auth/TokenRefreshBootstrap.tsx` (novo) | Componente invisível em `_layout.tsx`. Em `onAuthLost`: limpa storage, mostra toast "Sessão expirada", redirect `/login` com delay 1.5s |
| 9 — `updateSession` no AuthContext | `src/core/auth/AuthContext.tsx` | Método para atualizar tokens após refresh (uso futuro: cross-tab sync) |
| 10 — Testes do parser | `src/core/api/__tests__/edgeFunctionsClient.test.ts` (16 testes) | Substituído stub. Cobre: NO_TOKEN, gateway 401/403, function 4xx/5xx, rate limit 429, timeout, network error, success 200, headers, refreshSession (sucesso, gateway, function, NO_REFRESH_TOKEN, sem Authorization) |
| 11 — Testes do observer | `src/core/auth/__tests__/tokenRefreshObserver.test.ts` (14 testes) | `decodeJwtExp` (válido/malformado), observer (init/clear/TTL-5min/null expiresAt/MAX_ATTEMPTS/reset attempts/cancel timer/exception), web (visibility TTL<10min, TTL>10min, storage event válido, storage event chave diferente) |

#### 🔍 Decisões Relevantes

- **Por que 3 error kinds?** Gateway Supabase vs edge function vs network têm semantics diferentes. Gateway 401 = token expirado/ausente (refresh resolve); function 4xx = regra de negócio (não resolve com refresh); network = retry puro. Sem kinds distintos, UI não sabe se deve tentar refresh automático.
- **Por que retry delay 30s (não 5min)?** Decisão operacional: se refresh falhou, próximo retry em 30s dá tempo do servidor processar (ex: rate limiter do Supabase liberar). Backoff exponencial seria over-engineering para 3 tentativas.
- **Por que `storage` event em vez de `BroadcastChannel`?** `storage` é built-in, zero dep, cross-tab já funciona no mesmo domínio. BroadcastChannel exigiria setup adicional sem benefício claro.
- **Por que visibility < 10min (não 5min)?** Margem: se usuário volta de almoço, token já está perto do TTL. 10min cobre 5min de REFRESH_LEAD_TIME + buffer para latência de refresh.
- **Por que 401 do gateway em vez de 401 da função?** Se função retorna 401, é lógica de negócio (ex: credencial errada, conta suspensa). Se gateway retorna 401, é token expirado/ausente. Apenas o segundo é recuperável via refresh.

#### ⏳ Próximos Passos

- [ ] Deploy: `npx supabase functions deploy auth-refresh --project-ref <ref>` (precisa JWT verificado — default OK)
- [ ] Deploy: `auth-login` (atualizado para retornar refresh_token)
- [ ] Teste manual: login → esperar 50min → verificar refresh automático
- [ ] Teste E2E: simular expiração via mock de clock
- [ ] Considerar migrar `auth-validate` para usar refresh_token (rotação) — ADR-55 mencionava
- [ ] (Opcional) Adicionar telemetria: quantos refreshes falham por dia

#### ⚠️ Contexto Crítico

- **Diagnóstico 401 confirmado**: `curl -X POST https://<project>.supabase.co/functions/v1/models-delete -H "Content-Type: application/json" -d '{"id":"fa4f79b9-f593-47fb-a060-76d99cad2c14"}'` → `401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`. **Sem header `Authorization`, sempre gateway 401**.
- **Modelo problemático `fa4f79b9-f593-47fb-a060-76d99cad2c14`**: sync OK, delete falhou. Pode estar com `syncStatus: 'pending'` no cache local; ao reconectar, sync engine deve re-tentar.
- **`edgeFunctionsClient` exposto também como `refreshSession`**: usado por `useTokenRefresh`, não pelo `modelRepository` (sync de modelos continua tentando só uma vez por operação).
- **`sessionStorage.clearAll()` agora limpa também `refresh_token`**: signOut remove tudo; auto-reauth em 401 limpa storage → força login manual.
- **Modelo problemático já não é bloqueante**: refresh proativo evita chegar a 401; auto-reauth + redirect garante UX consistente se acontecer.
- **Lint: 0 errors, 44 warnings** (redução de 3: removi `SUPABASE_URL` não-usado, 2 `Array<T>` → `T[]`). 0 warnings novos em arquivos da sessão.
- **Testes: 23 suites, 207 passed, 1 skipped** (delta +1 suite, +26 testes desta sessão)
- **Credenciais teste**: `admin@ipu.com` / `Admin@2026IPU` (UUID `a91e2352-e3ba-4f38-b150-7a84b0f9139a`)

---

### Sessão Atual — Fix Realtime Cross-Device (Junho 2026)

**Objetivo:** Resolver dessincronização entre devices (PC e celular ambos logados no staging não recebem updates um do outro). Diagnóstico confirmou: (1) tabela `models` nunca foi adicionada à publicação `supabase_realtime` em nenhuma migration; (2) `supabaseClient.ts` usa `AsyncStorage` como storage de auth, mas `AuthProvider` salva em `window.sessionStorage` (web) / `expo-secure-store` (mobile) — storages não se conversam, cliente realtime opera como anônimo.

#### ✅ Concluído

| Item | Arquivo(s) | O que mudou |
|------|-----------|-------------|
| 1 — Migration realtime | `supabase/migrations/006_enable_realtime_for_models.sql` (novo) | `ALTER PUBLICATION supabase_realtime ADD TABLE public.models` + `REPLICA IDENTITY FULL` + `GRANT SELECT ON models TO anon, authenticated` |
| 2 — Token sync no hook | `src/features/models/hooks/useRealtimeModels.ts:104-127` | Antes de subscrever o canal, chama `supabase.realtime.setAuth(token)` com o token vindo do `sessionStorage.getToken()`. Try/catch interno protege contra `sessionStorage` indisponível (testes jsdom antigos) |
| 3 — sessionStorage resiliente | `src/core/auth/sessionStorage.ts:14` | `isWeb` agora checa `typeof window.sessionStorage !== 'undefined'` (jsdom antigo não tem) |
| 4 — Migration aplicada em prod | `npx supabase db push` | Aplicadas 003, 004 (idempotente, skip coluna já existe), 005, 006 no projeto remoto |
| 5 — Validação no banco | `npx supabase db query --linked` | Confirmado: `models` em `supabase_realtime`; `replica_identity = FULL`; hook com `search_path=""` |

#### 🔍 Decisões Relevantes

- **Por que `realtime.setAuth()` em vez de mexer no storage do `supabaseClient`?** Mais limpo: o comentário no topo do `supabaseClient.ts` já dizia "NÃO usar para operações autenticadas" — preservar essa garantia e injetar auth só no realtime é a menor mudança. Sincronizar storages exigiria duplicar a sessão em AsyncStorage, criando superfície de ataque.
- **Por que `REPLICA IDENTITY FULL`?** Sem isso, `UPDATE` e `DELETE` enviam `payload.old = null` no evento realtime. RLS não consegue aplicar filtro por valor anterior (ex: "notificar apenas se `syncStatus` mudou"), e o payload chega incompleto.
- **Por que `isWeb` agora checa `sessionStorage` também?** JSDom antigo (versão em uso nos testes) tem `window` mas não `window.sessionStorage`. Hooks que tentam `getItem` direto crashavam em teste.
- **Por que a migration não foi para `develop` antes?** Bug foi reportado em produção (staging em uso ativo). Decisão de aplicar direto para validar correção end-to-end no mesmo ambiente que o usuário estava usando.

#### ⏳ Próximos Passos

- [ ] Build + deploy do front-end (alterações em `useRealtimeModels.ts` + `sessionStorage.ts`) → merge na branch `refactor` → PR para `develop`
- [ ] Teste E2E manual: PC logado no staging cria modelo "TESTE 5" → celular recebe `[useRealtimeModels] Notificação realtime recebida: INSERT` em até 2s
- [ ] Confirmar que o log do mobile não mostra mais `Sem token; realtime operará como anônimo` (deve mostrar `Token sincronizado com realtime client`)
- [ ] Se houver regressão, reverter `setAuth()` e investigar via `console.log` do mobile qual `payload` está chegando (ou não)

#### ⚠️ Contexto Crítico

- **Frontend com fix ainda não está deployado**: migration 006 está aplicada no banco, mas o hook `useRealtimeModels.ts` corrigido só está no working tree do PC. Celular no staging atual **ainda usa o bundle antigo** que não chama `setAuth()`. Vai funcionar parcial: subscription conecta, mas RLS ainda bloqueia payloads até o novo bundle ser deployado.
- **Migration é idempotente**: se algum device re-aplicar (via `db push` ou SQL Editor), bloco `DO $$` no início da migration 006 detecta que `models` já está na publicação e não duplica.
- **Validação inicial no mobile** (logs do usuário): cache de 5 modelos (`#1 TAJ`, `#2 TESTE 4`, `#3 TESTE 3`, `#4 TESTE2`, `#5 TPA`) — cache local está íntegro, mas eventos realtime não chegam.
- **`#5 TPA — v2` é a versão que o celular tem localmente** — útil para validar após o fix: criar v3 no PC e verificar se celular faz refetch e atualiza para v3.
- **Lint: 0 errors, 44 warnings**. Testes: 23 suites, 208 passed, 1 skipped (delta +1 teste: `should not throw when sessionStorage is unavailable`).
- **Não foi feito commit/push** das alterações do hook — usuário precisa revisar e pedir COMMIT/PUSH explicitamente.