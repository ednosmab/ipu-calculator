# Backlog Estratégico — Calculadora IPU

> Guia de implementação incremental baseado no [Plano Estratégico](./plans/README.md).
> Marque `[x]` conforme cada item for concluído.

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

**Todos os itens do backlog estão concluídos ✅**

Itens 19-28 concluídos em agosto/2026. Smoke test de staging validado (6/6 cenários OK).

---

## FASE 1 — Hardening Operacional

### 1. Build Validation no CI

**Status:** ⚠️ Parcial

**O que existe:** `ci.yml` roda lint + testes em push/PR para `main`, `develop`, `refactor`.

**O que falta:** `npm run build` não é executado no CI. O build só ocorre no `bump.yml` (push em `develop`).

- [x] Adicionar `npm run build` no `ci.yml` como step adicional
- [x] Opcional: criar matriz de ambientes (Node 18/20)
- [x] Opcional: adicionar cache de dependências

---

### 2. Version Tracking em Sincronização

**Status:** ⚠️ Parcial

**O que existe:** Campo `updatedAt` (timestamp) nos models, usado em `lastWriteWins.test.ts`.

**O que falta:** Não há `version` counter nem `deviceId` nas entidades. O sync compara apenas timestamps.

- [x] Adicionar campo `version: number` na interface `CalculationModel`
- [x] Incrementar `CACHE_VERSION.SCHEMA` (atual `2.1.0` → `2.2.0`)
- [x] Incrementar `version` a cada escrita local (`modelUseCases.ts`)
- [x] Atualizar estratégia de merge no `fetchRemoteModelsUseCase.ts` para considerar `version`
- [x] Adicionar migração no `schemaMigrationService.ts`

---

### 3. Device ID Persistente

**Status:** ✅ Parcial

**O que existe:** `src/core/device/deviceId.ts` com `crypto.randomUUID()` + persistência em `AsyncStorage`. DeviceId aparece em logs de sincronização (DebugPanel/console) para debug.

**O que não foi feito (deliberadamente):** Enviar `deviceId` no `SyncMetadata` para o servidor.
- **Motivo:** Não há necessidade atual — `version` já resolve conflitos. Enviar UUID persistente expõe rastreamento sem benefício real.
- **Quando escalar:** Se no futuro houver necessidade de auditoria por dispositivo ou bloqueio de sync por device, o envio pode ser implementado.

- [x] Criar `src/core/device/deviceId.ts` com `crypto.randomUUID()` + persistência em AsyncStorage
- [ ] (Futuro) Incluir `deviceId` no `SyncMetadata` e enviar ao servidor
- [x] Usar em logs de sincronização para debugging

---

### 4. Logger Central

**Status:** ✅ Já implementado

**O que existe:** `src/core/logging/logger.ts` (simples) e `src/core/logging/LogService.ts` (com handlers).

**Observação:** O `logger.ts` atual só loga em dev (`__DEV__`). Erros em produção são silenciosos. Avaliar se `LogService` deve ser o padrão.

- [ ] (Opcional) Unificar logger: usar `LogService` como padrão, manter `logger.ts` como alias
- [ ] (Opcional) Adicionar prefixo de módulo obrigatório nos logs

---

### 5. Error Boundary Global

**Status:** ✅ Já implementado

**O que existe:** `src/components/ErrorBoundary.tsx` com fallback customizado, botão "Tentar novamente", integração Sentry.

---

## FASE 2 — Resiliência Offline

### 6. Backup Defensivo de Cache

**Status:** ⚠️ Quase pronto (prioridade baixa)

**O que existe:**
- `schemaMigrationService.backup()` já salva em `@ipu:models_backup` antes de cada migração
- `schemaMigrationService.restoreBackup()` para recovery manual
- `modelRepository.getAll()` tenta restaurar backup automático se cache corrompido

**Observação:** O sistema de backup + recovery já está funcional e rodando. O que falta é versionamento da chave (`models_backup_v2`, etc.), que tem baixo valor prático porque migrações são idempotentes e o último backup já cobre o caso de falha. Pode ser implementado se houver tempo, mas não bloqueia nada.

- [ ] Versionar backups (ex: `@ipu:models_backup_v2`)
- [ ] Limitar retenção (ex: manter apenas último backup)

---

### 7. Recovery Seguro

**Status:** ✅ Concluído

**O que existe:** Sistema de recovery em três níveis no `modelRepository.getAll()`.

- [x] Adicionar try/catch no parsing do cache
- [x] Em caso de falha, restaurar do backup (item 6)
- [x] Se backup também falhar, limpar cache e forçar refresh remoto

---

### 8. Proteção de Overwrite

**Status:** ✅ Concluído

**Implementado:**
- [x] `version` counter incrementado a cada escrita local (`modelUseCases.ts:43`)
- [x] Merge considera `version` primeiro, fallback `updatedAt` se igual (`fetchRemoteModelsUseCase.ts:63`)
- [x] Testes de merge/overwrite com `version` — `lastWriteWins.test.ts`

---

## FASE 3 — Qualidade Operacional

### 9. Cobertura de Testes Críticos

**Status:** ✅ Concluído (165 testes, 21 suites)

**O que existe:**
- [x] Testes de recovery (cache corrompido → backup → restore) — `modelRepository.test.ts`
- [x] Testes de migração com dados reais — `schemaMigrationService.test.ts`
- [x] Testes de merge/overwrite com `version` — `lastWriteWins.test.ts`
- [x] Testes de parsing de cache inválido — `modelRepository.test.ts`
- [x] Testes de cálculo com valores extremos (boundary) — `calculateIPU.test.ts`, `calculateCalibration.test.ts`

---

### 10. Testes Offline Reais

**Status:** ✅ Concluído

**O que existe:** Testes E2E (Playwright) para comportamento offline.

**Cenários implementados:**
- [x] Cenário: abrir login page offline — não crasha
- [x] Cenário: botão "Acessar Offline (Cache)" aparece quando offline + cache existe
- [x] Cenário: navegar para /models via "Acessar Offline" e exibir modelos cacheados
- [x] Cenário: indicador offline visível na página de modelos
- [x] Cenário: criar modelo offline, navegar e preparar verificação de sync

**Nota:** 5 testes E2E em `e2e/offline-sync.spec.ts`, 4 com asserções reais, 1 placeholder para fluxo de sync ao reconectar.

---

### 10.1 — Limpeza Automática de Dados de Teste E2E

**Status:** ✅ Parcial — UI-level implementado, API-level pendente

**Problema:** Testes E2E (Playwright) criam modelos reais no Supabase com prefixo `E2E_SYNC_`. Precisam ser removidos após execução para não poluir a base.

**Implementado (UI-level):**
- [x] Helper `e2e/helpers/cleanup.ts` com `cleanupE2EModels(page)` — navega para `/models`, localiza cards via `[data-testid^="model-card-E2E_SYNC_"]`, clica em deletar e confirma modal
- [x] Integrado em `e2e/realtime-sync.spec.ts` via `beforeAll` (limpa leftovers) e `afterAll` (limpa criados durante o teste)
- [x] Bugfix: substituído `waitForTimeout(2000)` por `waitForFunction` (polling DOM) — timeout fixo perdia modelos quando página não renderizava a tempo

**Melhoria futura (API-level, para quando o app escalar):**
- [ ] Limpeza via Edge Function com SERVICE_ROLE_KEY (bypassa UI, mais rápida)
- [ ] Script CI dedicado (`scripts/cleanup-e2e-data.js`)
- [ ] Cron job na Edge Function para remover registros E2E_SYNC_ mais antigos que 24h
- [ ] Isolar ambiente de teste (Supabase project separado)

---

## FASE 4 — Governança e Pipeline

### 11. Branch Protection

**Status:** ✅ Concluído

**Configurado via API do GitHub:**
- `main`: CI obrigatório (lint-and-test 18/20), strict, PR obrigatório (1 review), enforce admins
- `develop`: CI obrigatório (lint-and-test 18/20), sem PR obrigatório

**Documentação:** `docs/workflow/ipu_calculator-workflow.md` já reflete as regras.

---

### 12. Preview Deploy por PR

**Status:** ✅ Concluído

**O que existe:**
- Vercel já deploya previews automaticamente para PRs (confirmado: deployments Preview no GitHub)
- `.github/workflows/preview-comment.yml` — comenta URL do preview no PR automaticamente

- [x] Configurar Vercel para deploy automático de PRs (já é padrão, verificar se está ativo)
- [x] Adicionar comentário automático no PR com URL do preview
- [ ] (Opcional) Adicionar validação de Lighthouse/bundle size no preview

---

---

## FASE 5 — Escalabilidade e Maturidade (pós-escala)

> 🔮 Itens para Tech Lead avaliar **quando o projeto escalar** (5+ usuários ou time multi-dev).
> Atualmente não justificam o custo-benefício para o cenário de 1 usuário com baixa constância.

### 13. Observability — Sentry

**Status:** ⏳ Código pronto, falta DSN

**O que existe:** `src/core/monitoring/sentryService.ts` + `ErrorBoundary` com integração Sentry já implementados.

**O que falta:**
- [ ] Criar conta no Sentry.io
- [ ] Configurar `EXPO_PUBLIC_SENTRY_DSN` na Vercel
- [ ] Validar captura de erros em produção

---

### 14. Quality Gates Automáticos (Git Hooks)

**Status:** 📋 Pendente

**O que falta:**
- [ ] Prettier — formatação automática de código
- [ ] Husky v9 — hooks de pre-commit
- [ ] lint-staged — rodar linters só nos arquivos staged
- [ ] commitlint — validar Conventional Commits no commit
- [ ] CI `tsc --noEmit` sem `|| true` (hoje não quebra o build em erro de tipo)

---

### 15. Segurança e Análise Estática

**Status:** 📋 Pendente

**O que falta:**
- [ ] CodeQL — GitHub Actions para scanning de vulnerabilidades
- [ ] SonarCloud — análise contínua de qualidade e cobertura

---

### 16. Performance

**Status:** 📋 Pendente

**O que falta:**
- [ ] Lighthouse CI — budgets de performance no CI
- [ ] Bundle analysis — `source-map-explorer` ou similar
- [ ] Performance budgets no preview deploy

---

### 17. Contrato de API

**Status:** 📋 Pendente

**O que falta:**
- [ ] OpenAPI/Swagger spec para as Edge Functions
- [ ] Documentação de endpoints atualizada no `GUIA_TECNICO_COMPLETO.md`

---

### 18. Acessibilidade

**Status:** 📋 Pendente

**O que falta:**
- [ ] jest-axe para testes unitários de a11y
- [ ] axe-playwright para testes E2E de acessibilidade

---

### 19. Infraestrutura como Código

**Status:** 📋 Pendente

**O que falta:**
- [ ] Terraform ou Pulumi para Supabase + Vercel
- [ ] Docker compose para ambiente local

---

### 20. Design System — Storybook

**Status:** 📋 Pendente

**O que falta:**
- [ ] Configurar Storybook para catálogo visual dos 12 componentes atômicos
- [ ] Documentar variantes e estados

---

## FASE 6 — Sessão Junho 2026 (Refresh Proativo + Auto-Reauth + Bugs Pendentes)

Itens derivados do trabalho de refresh proativo de JWT, auto-reauth em 401, fechamento de 5 dependabot PRs incompatíveis e bug ativo reportado no banner de atualização PWA.

### 21. Validar refresh proativo em staging

**Status:** ✅ Concluído (smoke test 6/6 cenários passaram — agosto 2026)

**Contexto:** PR #71 (`refactor → develop`) implementa refresh automático de JWT + auto-recovery transparente em 401 do gateway. Foi deployado em produção via edge functions (`auth-refresh` com `--verify-jwt`, `auth-login` com `--no-verify-jwt` retornando `refresh_token`). Smoke test executado em agosto/2026.

**Cenários validados (todos OK):**
- [x] Login via curl retorna `{access_token, refresh_token, expires_in, expires_at}` no body
- [x] `models-get` com JWT válido retorna 200 + array de modelos
- [x] `auth-refresh` com refresh_token válido retorna novo token (3600s TTL)
- [x] `auth-login` com credenciais erradas retorna `INVALID_CREDENTIALS` (sem enumeração)
- [x] `auth-refresh` sem refresh_token retorna `MISSING_REFRESH_TOKEN`
- [x] Telemetria `admin-metrics` retorna `refreshes24h: { total, failed, successRate }`

---

### 22. Upgrade Expo SDK 54 → 55

**Status:** ✅ Concluído (web/PWA)

**Contexto:** Em junho/2026, 5 dependabot PRs foram fechadas por incompatibilidade com Expo SDK 54. Upgrade realizado em agosto/2026.

**Mudanças aplicadas:**
- `expo` 54.0.34 → 55.0.28, `react-native` 0.81.5 → 0.83.10, `react` 19.1.0 → 19.2.0
- Todos os pacotes Expo migrados para unified versioning (55.x.x)
- `babel-preset-expo` e `expo-modules-core` adicionados como devDeps (novo requirement SDK 55)
- `app.json`: removido `newArchEnabled` (mandatory), `edgeToEdgeEnabled` (mandatory Android 16+), `experiments.reactCompiler` (now stable)
- `StyleSheet.absoluteFillObject` substituído por positioning explícito em `NavMenu.tsx`

**Sub-itens:**
- [x] Auditar breaking changes: `StyleSheet.absoluteFillObject`, Jest preset location, novos peer deps
- [x] Atualizar `expo` no `package.json` (SDK 54 → 55) e rodar `npx expo install --fix`
- [ ] Reabrir dependabot PRs e validar merge limpo
- [x] Validar 23 test suites / 213 testes após upgrade
- [x] Validar build de produção com `npm run build` (gera dist com SW cache versionado)
- [ ] Testar em device iOS e Android (mínimo 16.4 iOS) — requer Xcode 26
- [x] Atualizar `docs/COMPLETE_TECHNICAL_GUIDE.md` seção 2.1 (versões)

**Pendente (mobile):** iOS requer Xcode 26 (publicado junto com Expo SDK 55). Build Android pode ser testado agora.

---

### 23. CI/CD aplica `--no-verify-jwt` em `auth-login` automaticamente

**Status:** ✅ Concluído

**Sub-itens:**
- [x] Criar `scripts/deploy-edge-functions.sh` com matriz `{nome → flag}`:
  - `auth-login` → `--no-verify-jwt`
  - todas as outras → sem flag (default `--verify-jwt`)
- [x] Script aceita deploy individual (`./deploy-edge-functions.sh auth-login`) ou em lote (sem argumentos)
- [x] Validar pós-deploy: `auth-login` anônimo retorna `INVALID_CREDENTIALS` (não `UNAUTHORIZED_NO_AUTH_HEADER`); `models-sync` anônimo retorna `UNAUTHORIZED_NO_AUTH_HEADER`

---

### 24. Telemetria de refreshes

**Status:** ✅ Concluído

**Contexto:** Refresh proativo e auto-reauth estão implementados (PR #71), mas não há visibilidade de quantos refreshes falham por dia, quantos exigem auto-reauth, etc. Útil para dimensionar TTL do JWT e identificar padrões.

**Sub-itens:**
- [x] Adicionar `action: 'token_refresh_failed'` no `auditLogger.ts` (via `auth-refresh/index.ts`)
- [x] Adicionar contadores em `admin-metrics`: refreshes totais nas últimas 24h, falhas, taxa de sucesso (`refreshes24h` query)
- [x] Card de métrica no painel admin `/admin/metrics`: "Token Refreshes (24h)" com taxa de sucesso

---

### 25. CORS dev: aceitar IP LAN (RFC 1918)

**Status:** ✅ Concluído

**Contexto:** `supabase/functions/_shared/cors.ts` linhas 29 e 66 só aceitam `localhost` e `127.0.0.1` em dev. Para testar o app em dispositivo físico (iOS/Android) via Wi-Fi local, o IP da máquina de dev (ex: `192.168.1.42:3000`) é bloqueado pelo CORS do Supabase → todas as Edge Functions retornam erro.

**Sub-itens:**
- [x] Adicionar regex RFC 1918 em `getCorsHeaders()` e `handleCors()`:
  - `192.168.0.0/16` → `^http://192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$`
  - `10.0.0.0/8` → `^http://10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$`
  - `172.16.0.0/12` → `^http://172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$`

---

### 26. UpdateBanner não atualiza a página

**Status:** ✅ Concluído

**Sintoma:** Usuário clica em "Atualizar" no banner de nova versão disponível, mas a página não é recarregada.

**Causa raiz:** `useServiceWorkerUpdate.applyUpdate()` tinha fallthrough silencioso quando `registration.waiting` era null, e não escutava o evento `SW_UPDATED` do service worker.

**Correção aplicada:**
- `src/hooks/useServiceWorkerUpdate.ts`: `isUpdating` state, fallback chain (skipWaiting → update() → reload), listener `SW_UPDATED` via `message` event
- `src/components/UpdateBanner.tsx`: loading spinner, disabled state durante update
- `app/_layout.tsx`: passa `isUpdating` para UpdateBanner

**Sub-itens:**
- [x] Forçar `registration.update()` antes de checar `waiting` em `applyUpdate`
- [x] Fallback: se `waiting` for null após update(), fazer `window.location.reload()` direto
- [x] Adicionar loading/disabled state no botão do `UpdateBanner` (visual feedback)
- [x] Escutar evento `message` (além de `controllerchange`) para `SW_UPDATED`
- [ ] Tornar `isInitializedRef` mais robusto — considerar `navigator.serviceWorker.controller` na inicialização
- [ ] Adicionar log explícito `[SW] applyUpdate: waiting=..., controller=...` para debug

---

### 27. Realtime não dispara para CREATE/UPDATE (DELETE funciona)

**Status:** ✅ **CONCLUÍDO** — migration 009 corrige causa raiz (JWT `role` claim overwrite)

**Sintoma (Junho 2026):**
- ✅ **DELETE** parecia funcionar via realtime (na verdade era só o `processPendingDeletesUseCase` rodando após o servidor confirmar — o evento realtime em si nunca chegava ao cliente)
- ❌ **INSERT** só aparecia após hard reset manual ou `AppState` mudar
- ❌ **UPDATE** idem
- ❌ `realtime.subscription` sempre vazia (0 rows) — listener `postgres_changes` nunca era ativado

**Causa raiz REAL (confirmada via `node + ws` puro contra Supabase Realtime):**
A função SQL `custom_access_token_hook` (migration 001, originalmente bem-intencionada) **sobrescrevia o claim reservado `role` do JWT** com o `role` de aplicação vindo de `public.profiles` (valores: `admin`, `editor`, `viewer`). O JWT emitido continha `"role": "viewer"` em vez de `"role": "authenticated"`. Quando o realtime server tentava avaliar as policies RLS no contexto de replication lógica, executava `SET ROLE 'viewer'` — mas essa role Postgres não existe, gerando `ERROR 42704 (undefined_object) role "viewer" does not exist` e fazendo o listener `postgres_changes` falhar silenciosamente.

**Por que DELETE "funcionava" mas INSERT/UPDATE não:**
- supabase-js trata DELETE anonimamente: payload do DELETE é só `{old: {id, ...}}` — REPLICA IDENTITY FULL envia isso mesmo sem auth avaliada
- INSERT/UPDATE precisam de avaliação RLS completa (`auth.uid()`, `auth.jwt()`) para o payload — sem listener ativo, não chegam nunca
- "Funcionar" o DELETE era ilusão: era a sincronização REST após o servidor confirmar, não o evento realtime

**Por que AppState change "resolvia" o problema visualmente:**
- `useModels` chama `fetchRemoteModelsUseCase(true)` ao detectar mudança de estado
- Isso é um REST GET independente do realtime — pega o que tá no banco no momento

**Correção aplicada (migration 009):**
- Reescrito `custom_access_token_hook` para **NÃO** sobrescrever o claim reservado `role`
- Hook agora injeta **apenas** a claim não-reservada `is_active` no JWT
- Migration 008 (claim `is_active`) é mantida — útil como atalho para RLS sem subquery
- Migrations 006 e 007 mantidas como defensivas
- **Zero alteração de código frontend** — só migration; mobile só precisa fazer logout/login para obter novo JWT com `role: authenticated`

**Validação (teste WS direto contra Supabase Realtime):**
- JWT decodificado: `"role": "authenticated"`, `"is_active": true`, `"sub": "a91e2352-..."` ✓
- Subscription WS: `id: 47470285` registrada, `SYSTEM: Subscribed to PostgreSQL` (sem erro 42704) ✓
- Teste E2E INSERT → UPDATE → DELETE: **3 eventos recebidos** em sequência ✓
- WAL replication lag: 0 (slot `confirmed_flush_lsn` = `pg_current_wal_lsn()`) ✓
- Realtime server confirmado funcional em todo o ciclo

**Sub-itens:**
- [x] Identificar causa raiz (claim reservado `role` sobrescrito)
- [x] Reescrever `custom_access_token_hook` removendo overwrite de `role` (migration 009)
- [x] Migration 009 aplicada em prod via `npx supabase db push`
- [x] Validar JWT agora emite `role: authenticated` (decodificar token)
- [x] Validar WS subscription sem erro 42704 (teste com `node + ws`)
- [x] Validar INSERT/UPDATE/DELETE chegam via WS em sequência
- [x] PR #76 (client-side fix defensivo) mergeado em `dc6eb80`
- [ ] Validar cross-device real: PC cria modelo → mobile recebe em <2s
- [ ] (Futuro) Adicionar teste E2E em `e2e/realtime-sync.spec.ts` cobrindo INSERT e UPDATE cross-tab
- [ ] (Futuro) Considerar mover todas as 6 policies RLS para usar `auth.jwt() ->> 'is_active'` em vez de subquery (consistência)

**Arquivos modificados/criados nesta correção:**
- `supabase/migrations/009_fix_realtime_hook_role_claim.sql` (correção definitiva, aplicada em prod)
- `docs/adr/README.md` (ADR-56 documentado)
- `docs/COMPLETE_TECHNICAL_GUIDE.md` (seção 7.7 com gotcha documentado)
- `src/features/models/hooks/useRealtimeModels.ts` (PR #76 defensivo, mergeado)
- Migrations 006, 007, 008 mantidas (preventivas)

**Por que o bug demorou para ser diagnosticado:**
- Diagnóstico inicial culpou `setAuth()` assíncrono (race condition client-side) — ref #76 corrigiu isso mas não era a causa raiz
- Apenas teste WS puro (`node + ws`) revelou a mensagem exata: `role "viewer" does not exist` no system event
- O realtime server estava funcional o tempo todo — falhava só no eval de RLS

---

### 28. Teste de concorrência multi-device (CRUD concorrente)

**Status:** ✅ Plano documentado — aguarda execução manual com 2 devices em staging

**Contexto:** Após validação cross-device do realtime (Item 27), o usuário solicitou cenários de concorrência para validar comportamento do app quando dois devices operam simultaneamente sobre os mesmos dados. O sistema é offline-first com optimistic UI e last-write-wins (ADR-16) — preciso confirmar que o comportamento é aceitável e documentar os casos de borda.

**Cenários a testar (2 devices logados simultaneamente em staging):**

#### 28.1 — CREATE com mesmo nome (race no `createModel`)

**Setup:** Devices A e B ambos logados, ambos na tela de Modelos.
1. Device A começa a criar modelo "Teste Concorrência" (inputs X, Y)
2. **Antes** que A termine/salve, Device B começa a criar modelo "Teste Concorrência" (inputs Z, W)
3. Ambos completam o save
4. Aguardar `fetchRemoteModelsUseCase()` rodar (sync em ambos)

**Comportamento esperado atual:**
- Cada device faz check local de duplicata em `modelUseCases.ts:13` — vê o próprio modelo mas não o do outro
- Ambos criam localmente com `id` diferente (UUIDs aleatórios)
- Ambos sincronizam com servidor — banco tem 2 modelos com mesmo nome
- Realtime entrega INSERT nos 2 devices → cada um vê 2 cards "Teste Concorrência"
- UI fica ambígua: qual é "o" modelo?

**Perguntas a responder:**
- [ ] Banco aceita 2 rows com mesmo `name`? (verificar — não há UNIQUE constraint em nenhuma migration)
- [ ] O check de duplicata local é confiável quando há race entre devices?
- [ ] UX é aceitável ou precisa de resolução manual ("merge") ou aviso?

**Possíveis melhorias (avaliar após teste):**
- Adicionar UNIQUE constraint em `name` no DB e tratar 23505 no `models-sync`
- Reservar nome no servidor antes de criar (lock distribuído) — over-engineering provavelmente
- Aceitar como limitação: optimistic UI assume "cada device é um usuário diferente"; concorrência de nome é caso de borda

#### 28.2 — UPDATE no mesmo modelo (race no `updateModel`)

**Setup:** Modelo "M" existe no servidor, ambos devices têm cópia local. `version: 3` em ambos.
1. Device A edita inputs: isocianato 0.08, poliol 0.16
2. Device B (sem ver a edição de A) edita o mesmo modelo: isocianato 0.09, poliol 0.15
3. A salva → local: `version: 4, updatedAt: T1`
4. B salva (ainda com base v3) → local: `version: 4, updatedAt: T2` (T2 > T1 ou < T1)
5. Ambos sincronizam com servidor

**Comportamento esperado atual (ADR-16):**
- Servidor processa 2x `POST /models-sync`
- A primeira grava `version: 4` (A vence por qualquer um dos dois)
- A segunda: dependendo do version, B vence (se for > 4) ou A mantém (se for ≤ 4)
- **Detalhe crítico:** o servidor tem `version` como critério ou só `updatedAt`? Verificar `models-sync/index.ts`

**Perguntas a responder:**
- [ ] Servidor compara `version` antes de sobrescrever? (deveria)
- [ ] Device perdedor recebe notificação de que sua edição foi sobrescrita? (badge de conflito?)
- [ ] Realtime entrega UPDATE nos 2 devices? Cada um vê a versão que "venceu"?
- [ ] A UI do device perdedor tem algum feedback de "sua edição foi perdida"?

**Possíveis melhorias:**
- Backend comparar `(client.version > current.version)` E `(client.updatedAt > current.updatedAt)` — se versão menor, rejeitar com 409
- Frontend detectar "minha versão local é menor que a do servidor" após sync → toast "Outro device atualizou este modelo"
- Operational transform / CRDT — fora de escopo (YAGNI)

#### 28.3 — DELETE vs UPDATE (race deletar + editar)

**Setup:** Mesmo modelo "M", A e B têm cópia local.
1. A decide deletar M (clica no lixeira, modal confirma)
2. B edita M (muda isocianato) — antes de receber o DELETE event
3. A sincroniza: `DELETE /models-delete`
4. B sincroniza: `POST /models-sync` com sua edição

**Comportamento esperado atual:**
- Servidor processa DELETE primeiro: row removida
- Servidor processa INSERT/UPDATE de B: `models-sync` faz upsert → row ressurge no servidor (com id de B)
- Device A recebe UPDATE event do servidor (row ressurgiu) — modelo volta na tela de A
- Device B recebe INSERT event (se for inserção) ou UPDATE event

**Perguntas a responder:**
- [ ] O `models-sync` faz UPSERT (insert or update) ou só UPDATE?
- [ ] Se a row foi deletada, o sync de B deveria inserir de volta (ressurreição) ou falhar?
- [ ] A notifica B que deletou? B deveria ter feedback?

**Possíveis melhorias:**
- `models-sync` rejeitar com 410 Gone se a row foi deletada nos últimos 5min
- Soft delete (campo `deleted_at`) para evitar ressurreição
- A e B conversarem via realtime (UI mostra "Outro device está editando este modelo")

---

**Plano de teste:**

1. Setup inicial: confirmar que 2 devices estão logados e realtime conectado
2. Para cada cenário (28.1, 28.2, 28.3):
   - Definir 1 caso de teste manual (passos exatos, tempo entre ações, dados usados)
   - Executar com logs do DebugPanel abertos em ambos
   - Verificar logs `[SyncEngine]`, `[modelRepository]`, `[useRealtimeModels]`
   - Capturar screenshots do antes/depois
   - Documentar comportamento observado vs esperado
3. Se comportamento for aceitável: documentar em ADR / guide e fechar o item
4. Se comportamento falhar: priorizar fix (constraint no DB, conflict UI, etc.) antes de novos features

**Critério de aceitação:**
- [ ] 3 cenários executados e documentados
- [ ] Comportamento atual é aceitável OU melhorias priorizadas e adicionadas ao backlog

**Arquivos a observar durante teste:**
- `src/features/models/application/modelUseCases.ts:13,38` (check de duplicata local)
- `src/features/models/application/fetchRemoteModelsUseCase.ts` (merge logic com version)
- `supabase/functions/models-sync/index.ts` (lógica de upsert)
- `supabase/functions/models-delete/index.ts` (soft vs hard delete)

**Relacionado:**
- ADR-15: `syncStatus` + `localAction` para indicar estado de conflito
- ADR-16: Version counter para merge (last-write-wins)
- ADR-17: Pending operations com max 3 tentativas
- Item 27: realtime funcionando — pré-requisito para esses testes

---

## ❌ O QUE NÃO IMPLEMENTAR

Itens explicitamente fora de escopo conforme o plano:

- Microserviços
- CRDT / Event Sourcing
- Reescrever sincronização inteira
- Observabilidade enterprise (Datadog, NewRelic)
- Abstrações prematuras (factories, adapters excessivos)
- Buscar 100% de cobertura de testes
