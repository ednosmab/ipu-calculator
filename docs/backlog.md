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

- [ ] Adicionar campo `version: number` na interface `CalculationModel`
- [ ] Incrementar `CACHE_VERSION.SCHEMA` (atual `2.1.0` → `2.2.0`)
- [ ] Incrementar `version` a cada escrita local (`modelUseCases.ts`)
- [ ] Atualizar estratégia de merge no `fetchRemoteModelsUseCase.ts` para considerar `version`
- [ ] Adicionar migração no `schemaMigrationService.ts`

---

### 3. Device ID Persistente

**Status:** ❌ Não implementado

**O que existe:** Nada.

- [ ] Criar `src/core/device/deviceId.ts` com `crypto.randomUUID()` + persistência em AsyncStorage
- [ ] Incluir `deviceId` no `SyncMetadata`
- [ ] Usar em logs de sincronização para debugging

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

**Status:** ❌ Não implementado

**O que existe:** Nada.

- [ ] Antes de migrações de schema, fazer backup em `@ipu:models_backup`
- [ ] Versionar backups (ex: `@ipu:models_backup_v2`)
- [ ] Limitar retenção (ex: manter apenas último backup)

---

### 7. Recovery Seguro

**Status:** ⚠️ Parcial

**O que existe:** `schemaMigrationService.ts` que valida versão e marca pendentes para re-sync.

**O que falta:** Não há backup para recovery em caso de cache corrompido.

- [ ] Adicionar try/catch no parsing do cache
- [ ] Em caso de falha, restaurar do backup (item 6)
- [ ] Se backup também falhar, limpar cache e forçar refresh remoto

---

### 8. Proteção de Overwrite

**Status:** ⚠️ Parcial

**O que existe:** Comparação por `updatedAt` no `fetchRemoteModelsUseCase.ts`.

**O que falta:** Sem `version` counter, conflitos simultâneos podem perder dados.

- [ ] Após implementar item 2 (version tracking), atualizar a lógica de merge:
  ```ts
  if (remote.version > local.version) applyRemote()
  ```
- [ ] Manter fallback para `updatedAt` se `version` for igual

---

## FASE 3 — Qualidade Operacional

### 9. Cobertura de Testes Críticos

**Status:** ⚠️ Parcial (100 testes, 21 suites)

**O que existe:** Testes de domínio, repositório, sync, hooks, schemas.

**O que falta com base nas prioridades do plano:**
- [ ] Testes de recovery (cache corrompido → backup → restore)
- [ ] Testes de migração com dados reais
- [ ] Testes de merge/overwrite com `version`
- [ ] Testes de parsing de cache inválido
- [ ] Testes de cálculo com valores extremos (boundary)

---

### 10. Testes Offline Reais

**Status:** ❌ Não implementado

**O que existe:** Testes E2E (Playwright) para sync em tempo real.

**O que falta:**
- [ ] Cenário: abrir app offline
- [ ] Cenário: fechar abruptamente durante sync
- [ ] Cenário: reinstalar PWA sem limpar cache
- [ ] Cenário: sync após alternar rede (online → offline → online)
- [ ] Cenário: criar modelo offline, fechar, abrir online, verificar sync

---

## FASE 4 — Governança e Pipeline

### 11. Branch Protection

**Status:** ❌ Não implementado no GitHub

**O que existe:** Política documentada em `docs/workflow/ipu_calculator-workflow.md`.

**O que falta:**
- [ ] Configurar branch protection no GitHub:
  - `main`: CI obrigatório, sem push direto, PR obrigatório
  - `develop`: CI obrigatório
- [ ] Atualizar documentação com as regras configuradas

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
