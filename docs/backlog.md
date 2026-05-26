# Backlog Estratégico — Calculadora IPU

> Guia de implementação incremental baseado no [Plano Estratégico](./plans/README.md).
> Marque `[x]` conforme cada item for concluído.

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

## FASE 4 — Governança e Pipeline

### 11. Branch Protection

**Status:** ✅ Concluído

**Configurado via API do GitHub:**
- `main`: CI obrigatório (lint-and-test 18/20), strict, PR obrigatório (1 review), enforce admins
- `develop`: CI obrigatório (lint-and-test 18/20), sem PR obrigatório

**Documentação:** `docs/workflow/ipu_calculator-workflow.md` já reflete as regras.

---

### 12. Preview Deploy por PR

**Status:** ❌ Não implementado

**O que existe:** Nada.

- [ ] Configurar Vercel para deploy automático de PRs (já é padrão, verificar se está ativo)
- [ ] Adicionar comentário automático no PR com URL do preview
- [ ] (Opcional) Adicionar validação de Lighthouse/bundle size no preview

---

## ❌ O QUE NÃO IMPLEMENTAR

Itens explicitamente fora de escopo conforme o plano:

- Microserviços
- CRDT / Event Sourcing
- Reescrever sincronização inteira
- Observabilidade enterprise (Datadog, NewRelic)
- Abstrações prematuras (factories, adapters excessivos)
- Buscar 100% de cobertura de testes
