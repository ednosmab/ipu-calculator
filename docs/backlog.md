# Backlog Estratégico — Calculadora IPU

> Guia de implementação incremental baseado no [Plano Estratégico](./plans/README.md).
> Marque `[x]` conforme cada item for concluído.

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

Ordem de ataque sugerida ao retomar a próxima sessão:

1. **Item 27 — Realtime não dispara para CREATE/UPDATE** 🔴 (bug ativo reportado, parte do fix realtime da FASE 6)
2. **Item 26 — UpdateBanner não atualiza a página** 🔴 (bug ativo reportado)
3. **Item 21 — Validar refresh proativo em staging** 🟡 (depende de merge do PR #72/#73)
4. **Itens 22-25** — podem ser atacados em qualquer ordem; nenhum é bloqueante.

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

**Status:** 🟡 Pendente (depende de merge do PR #71)

**Contexto:** PR #71 (`refactor → develop`) implementa refresh automático de JWT + auto-recovery transparente em 401 do gateway. Foi deployado em produção via edge functions (`auth-refresh` com `--verify-jwt`, `auth-login` com `--no-verify-jwt` retornando `refresh_token`). Falta smoke test em ambiente real.

**Cenários a validar (em `https://ipu-calculator-staging.vercel.app`):**
- [ ] Login via curl retorna `{access_token, refresh_token, expires_in, expires_at}` no body
- [ ] Aguardar ~55min em aba aberta OU reduzir JWT TTL no Supabase Dashboard (Auth → JWT Expiry) para 5min
- [ ] Console DevTools mostra `[useTokenRefresh] Token refreshed successfully` antes da expiração
- [ ] Forçar 401 (limpar `ipu_session` do sessionStorage) → auto-recovery OU toast "Sessão expirada" + redirect `/login` após 3 falhas
- [ ] Realtime continua funcionando entre tabs (não regrediu)

**Critério de aceitação:** Todos os 5 cenários verificados com logs correspondentes no console.

---

### 22. Upgrade Expo SDK 54 → 55

**Status:** 🟡 Pendente (workload grande, não urgente)

**Contexto:** Em junho/2026, 5 dependabot PRs foram fechadas por incompatibilidade com Expo SDK 54:
- #65 `react-test-renderer 19.1.0→19.2.7` — peer `react@^19.2.7` (temos 19.1.0)
- #66 `react-native 0.81.5→0.85.3` — requer Expo SDK 55+; breaking changes (`StyleSheet.absoluteFillObject` removido, Jest preset movido)
- #67 `expo-secure-store 55.0.13→56.0.4` — requer Expo SDK 55+; 56.0.0 elevou iOS mínimo para 16.4
- #68 `eslint-config-expo 10.0.0→56.0.4` — versão do config segue Expo SDK (56 = SDK 56)
- #69 `react-native-reanimated 4.1.7→4.4.0` — peer `react-native@0.83-0.86` (temos 0.81.5)

Três PRs adicionais de `dependabot ignore` foram aplicados para evitar reabertura.

**Sub-itens:**
- [ ] Auditar breaking changes: `StyleSheet.absoluteFillObject`, Jest preset location, novos peer deps
- [ ] Atualizar `expo` no `package.json` (SDK 54 → 55) e rodar `npx expo install --fix`
- [ ] Reabrir dependabot PRs e validar merge limpo
- [ ] Validar 23 test suites / 207 testes após upgrade
- [ ] Validar build de produção com `npm run build` (gera dist com SW cache versionado)
- [ ] Testar em device iOS e Android (mínimo 16.4 iOS)
- [ ] Atualizar `docs/GUIA_TECNICO_COMPLETO.md` seção 2.1 (versões)

**Não-objetivo:** Não é uma única sessão — estimar 1-2 dias de trabalho com testes extensivos.

---

### 23. CI/CD aplica `--no-verify-jwt` em `auth-login` automaticamente

**Status:** 🟡 Pendente (automatização útil)

**Contexto:** ADR-55 documenta que `auth-login` é a única Edge Function deployada com flag `--no-verify-jwt` (chicken-and-egg: precisa de função sem JWT para entregar JWT). Atualmente o deploy é manual: cada nova função precisa lembrar da flag correta. Esquecer causa 401 do gateway que se manifesta como `INVALID_CREDENTIALS` para o usuário (silencioso).

**Sub-itens:**
- [ ] Criar `scripts/deploy-edge-functions.sh` com matriz `{nome → flag}`:
  - `auth-login` → `--no-verify-jwt`
  - todas as outras → sem flag (default `--verify-jwt`)
- [ ] Script aceita deploy individual (`./deploy-edge-functions.sh auth-login`) ou em lote (sem argumentos)
- [ ] Validar pós-deploy: `auth-login` anônimo retorna `INVALID_CREDENTIALS` (não `UNAUTHORIZED_NO_AUTH_HEADER`); `models-sync` anônimo retorna `UNAUTHORIZED_NO_AUTH_HEADER`
- [ ] Documentar uso no `docs/workflow/ipu_calculator-workflow.md`

---

### 24. Telemetria de refreshes

**Status:** 🔵 Pendente (nice-to-have)

**Contexto:** Refresh proativo e auto-reauth estão implementados (PR #71), mas não há visibilidade de quantos refreshes falham por dia, quantos exigem auto-reauth, etc. Útil para dimensionar TTL do JWT e identificar padrões.

**Sub-itens:**
- [ ] Adicionar `action: 'token_refresh_success'` e `'token_refresh_failed'` no `auditLogger.ts`
- [ ] Adicionar contadores em `admin-metrics`: refreshes totais nas últimas 24h, falhas, taxa de sucesso
- [ ] Card de métrica no painel admin `/admin/metrics`: "Token Refreshes (24h)" com taxa de sucesso
- [ ] Documentar em `docs/autentication/skill/access_logs_metrics_protocol.md`

---

### 25. CORS dev: aceitar IP LAN (RFC 1918)

**Status:** 🔵 Pendente (nice-to-have)

**Contexto:** `supabase/functions/_shared/cors.ts` linhas 29 e 66 só aceitam `localhost` e `127.0.0.1` em dev. Para testar o app em dispositivo físico (iOS/Android) via Wi-Fi local, o IP da máquina de dev (ex: `192.168.1.42:3000`) é bloqueado pelo CORS do Supabase → todas as Edge Functions retornam erro.

**Sub-itens:**
- [ ] Adicionar regex RFC 1918 em `getCorsHeaders()` e `handleCors()`:
  - `192.168.0.0/16` → `^http://192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$`
  - `10.0.0.0/8` → `^http://10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$`
  - `172.16.0.0/12` → `^http://172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$`
- [ ] Adicionar teste em `supabase/functions/__tests__/cors-config.test.ts` (se existir) ou criar
- [ ] Documentar em `docs/skill/network_cors_protocol.md` como testar em device físico

---

### 26. UpdateBanner não atualiza a página

**Status:** 🔴 Pendente — **PRÓXIMA SESSÃO** (bug ativo reportado pelo usuário)

**Sintoma:** Usuário clica em "Atualizar" no banner de nova versão disponível, mas a página não é recarregada.

**Causa raiz:** `useServiceWorkerUpdate.applyUpdate()` (linha 33-44) tem fallthrough silencioso:

```ts
const applyUpdate = useCallback(async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.waiting) {                              // ← única ação
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
  // ❌ se waiting for null, função retorna sem fazer nada
}, []);
```

**Por que clica e nada acontece (hipóteses ordenadas):**
1. `registration.waiting === null` no momento do clique (update não está no estado `installed` ainda, ou foi consumido em reload anterior) → função retorna no-op, usuário sem feedback.
2. Hook nunca chama `registration.update()` antes de checar `waiting` → estado stale se página ficou aberta > 1h sem `visibilitychange`.
3. Hook escuta apenas `controllerchange`, não `message` → SW envia `SW_UPDATED` (linha 67 do `service-worker.js`) mas hook ignora.
4. Sem loading state no botão → usuário clica, banner some/continua igual, sem indicação visual de progresso.

**Arquivos afetados:**
- `src/hooks/useServiceWorkerUpdate.ts:33-44` (causa raiz)
- `src/components/UpdateBanner.tsx` (sem loading state)
- `public/service-worker.js:55-74` (envia `SW_UPDATED` que hook ignora)

**Sub-itens propostos:**
- [ ] Forçar `registration.update()` antes de checar `waiting` em `applyUpdate`
- [ ] Fallback: se `waiting` for null após update(), fazer `window.location.reload()` direto
- [ ] Adicionar loading/disabled state no botão do `UpdateBanner` (visual feedback)
- [ ] Escutar evento `message` (além de `controllerchange`) para `SW_UPDATED`
- [ ] Tornar `isInitializedRef` mais robusto — considerar `navigator.serviceWorker.controller` na inicialização em vez de esperar primeiro `controllerchange`
- [ ] Adicionar log explícito `[SW] applyUpdate: waiting=..., controller=...` para debug
- [ ] Teste manual: deploy v1.0.0 → abrir aba → deploy v1.0.1 → esperar banner → clicar → verificar reload
- [ ] Adicionar teste E2E em `e2e/` se viável (Playwright suporta service workers)

---

### 27. Realtime não dispara para CREATE/UPDATE (DELETE funciona)

**Status:** 🟡 PR #76 criado — race condition client-side corrigida, aguardando validação final

**Sintoma (Junho 2026):** Após merge do PR #72 (migration 006 + `setAuth(token)` no `useRealtimeModels`):
- ✅ **DELETE** em um device aparece em tempo real no outro device
- ❌ **CREATE** (INSERT) só aparece após hard reset manual (limpar cache + reload)
- ❌ **UPDATE** (edição) só aparece após hard reset manual
- ❌ O padrão "minimizar e abrir" funciona porque `AppState.addEventListener('change', ...)` chama `fetchModels(true)` — confirma que `fetchRemoteModelsUseCase` está ok, problema é delivery

**Causa raiz REAL (confirmada via `realtime.subscription` no banco):**
Migrations 007 e 008 (RLS) **não eram** o problema. O bug era **client-side race condition**:
- `supabase.realtime.setAuth(token)` era chamado dentro de `sessionStorage.getToken().then(...)` (async)
- `channel.subscribe()` é sync
- O WebSocket iniciava o handshake **antes** do token ser setado → conectava como **anônimo**
- `realtime.subscription` no banco confirmava: `role=anon`, `user_id=NULL`, `is_active=NULL`

**Por que DELETE funcionava mas INSERT/UPDATE não:** Em conexões anônimas, o realtime do supabase-js trata DELETE de forma diferente (payload precisa apenas de `old.id`, REPLICA IDENTITY FULL envia isso). INSERT/UPDATE precisam de avaliação completa da policy RLS com `auth.uid()`/`auth.jwt()`, e falham silenciosamente.

**Correção aplicada (PR #76):**
- `useRealtimeModels.ts`: setup do canal virou IIFE async que **aguarda** o token antes de chamar `setAuth()` e `subscribe()`
- Flag `cancelled` evita vazamento se componente desmontar durante o fetch do token
- Mantidas as migrations 007 e 008 (007 virou dead code removido pela 008, ambas aplicadas no prod)
- Migrations são preventivas: protegem contra RLS subquery se alguém subscrever ao realtime sem `setAuth` no futuro

**Validação server-side (após PR #76 mergeado):**
```sql
SELECT claims->>'role' AS role, claims->>'is_active' AS is_active, claims->>'sub' AS user_id
FROM realtime.subscription;
-- Esperado: role=authenticated, is_active=true, user_id=<uuid> (não mais anon)
```

**Sub-itens:**
- [x] Identificar causa raiz (race condition client-side, não RLS)
- [x] Migration 007 (SECURITY DEFINER function) — não corrigiu mas removida pela 008
- [x] Migration 008 (JWT claim approach) — aplicada em prod (preventiva)
- [x] PR #76: await token antes de subscribe (correção definitiva)
- [ ] Validar realtime cross-device: INSERT e UPDATE chegam sem hard reset
- [ ] Validar `realtime.subscription` mostra `role=authenticated` após PR #76
- [ ] Adicionar teste E2E em `e2e/realtime-sync.spec.ts` cobrindo INSERT e UPDATE cross-tab
- [ ] (Futuro) Atualizar policies INSERT/UPDATE/DELETE para usar a mesma claim (consistência)

**Arquivos modificados/criados nesta correção:**
- `supabase/migrations/007_simplify_models_rls_for_realtime.sql` (não corrigiu, função removida)
- `supabase/migrations/008_jwt_claim_for_models_rls.sql` (correção defensiva, aplicada)
- `src/features/models/hooks/useRealtimeModels.ts` (corrigido no PR #72 logging, PR #76 race condition)

---

## ❌ O QUE NÃO IMPLEMENTAR

Itens explicitamente fora de escopo conforme o plano:

- Microserviços
- CRDT / Event Sourcing
- Reescrever sincronização inteira
- Observabilidade enterprise (Datadog, NewRelic)
- Abstrações prematuras (factories, adapters excessivos)
- Buscar 100% de cobertura de testes
