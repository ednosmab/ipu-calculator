# SKILL: Sync Engine & Offline-First Architecture

Sempre que implementar ou modificar qualquer parte relacionada a sincronização, persistência local ou comportamento offline, siga este protocolo. Ele documenta o contrato real do sistema tal como está implementado.

---

## 🏗️ Arquitetura do Sistema de Sync

```
UI → Hook (useRealtimeModels / useSyncEngine)
       ↓
   Use Case (application/)
       ↓
   Repository (infra/modelRepository)
       ↓
   AsyncStorage ←→ Supabase (remoto)
```

### Camadas e responsabilidades

| Camada | Arquivo | Responsabilidade |
|--------|---------|-----------------|
| Hook de ciclo de vida | `useSyncEngine.ts` | Init, migração, escuta de reconexão |
| Hook de tempo real | `useRealtimeModels.ts` | Supabase Realtime, subscribe/unsubscribe |
| Use Cases | `syncModelsUseCase.ts`, `fetchRemoteModelsUseCase.ts` | Orquestração sem UI |
| Repository | `modelRepository.ts` | Leitura/escrita local + TTL + notificação de listeners |
| Serviços de infra | `modelSyncService.ts`, `pendingOpsService.ts` | Sync ponto-a-ponto e fila de pendências |

---

## 🔁 Fluxo de Inicialização

Ao montar o app (`useSyncEngine`):

1. `schemaMigrationService.migrateIfNeeded()` — garante formato do storage
2. `syncModelsUseCase()` — envia pending locais para o remoto
3. `fetchRemoteModelsUseCase()` — traz dados remotos e mescla com local
4. `processPendingDeletesUseCase()` — reprocessa deletes que falharam
5. `processPendingEditsUseCase()` — reprocessa edits que falharam

**Regra crítica:** `isFirstRun.current = false` só ocorre no `finally` do init, nunca antes. Isso evita que o listener de reconexão dispare sync duplicado na primeira carga.

---

## 📦 Formato do Cache Local (AsyncStorage)

**Chave:** `@ipu:models`

```ts
interface CacheMetadata {
  data: CalculationModel[];
  expiresAt: number;      // Date.now() + 48h
  schemaVersion: string;  // CACHE_VERSION.SCHEMA (obrigatório)
}
```

**Nunca** gravar `CalculationModel[]` diretamente na chave `@ipu:models`. Sempre usar `modelRepository.saveWithTTL()` ou garantir que o objeto siga a interface `CacheMetadata`.

---

## ⏱️ TTL e Invalidação

- TTL padrão: **48 horas** (`CACHE_VERSION.MODEL_TTL_MS`)
- Cache expirado → retorna dados obsoletos + dispara refresh em background (stale-while-revalidate)
- Cache com `schemaVersion` divergente → apaga e retorna `[]` imediatamente
- **Constante única:** importar sempre de `src/core/versioning/cacheVersion.ts`; não duplicar em outros arquivos

---

## 🔒 Mutex de Escrita

Todas as operações de escrita no repository passam por `withWriteLock`:

```ts
// ✅ CORRETO — operações atômicas
await modelRepository.create(model);   // usa withWriteLock internamente
await modelRepository.update(model);   // usa withWriteLock internamente

// ❌ ERRADO — escrita direta contornando o mutex
await asyncStorageClient.set(STORAGE_KEYS.MODELS, newData);
```

A única exceção histórica é `fetchRemoteModelsUseCase`, que escreve direto — isso é um débito técnico a eliminar.

---

## 🔄 Estados de Sincronização do Model

```ts
syncStatus: 'synced' | 'pending'
localAction: 'created' | 'edited' | null
```

| syncStatus | localAction | Significado |
|------------|-------------|-------------|
| `synced` | `null` | Confirmado no remoto |
| `pending` | `'created'` | Criado offline, aguarda envio |
| `pending` | `'edited'` | Editado offline, aguarda envio |

Ao sincronizar com sucesso, sempre setar: `{ syncStatus: 'synced', localAction: null }`.

---

## 🚦 Filas de Operações Pendentes

- **Pending deletes:** `@ipu:pending_deletes` — array de IDs
- **Pending edits:** `@ipu:pending_edits` — array de `PendingOperation`
- Máximo de tentativas: `MAX_ATTEMPTS = 3` (definido em `pendingOperation.ts`)
- Após MAX_ATTEMPTS: operação descartada com `logger.warn`

---

## 🌐 Supabase Realtime

- Subscribe via `useRealtimeModels` para INSERT, UPDATE, DELETE na tabela `models`
- Eventos remotos não passam pelo `withWriteLock` diretamente — usar `createFromRemote` e `removeLocal` para operações via Realtime
- Supabase API calls **não** são interceptadas pelo Service Worker (filtro explícito em `service-worker.js`)

---

## ⚠️ Checklist antes de modificar sync

- [ ] A escrita passa por `modelRepository.saveWithTTL()` (não direto no asyncStorageClient)?
- [ ] O objeto salvo inclui `schemaVersion`?
- [ ] Bump de `SCHEMA_VERSION` tem migração correspondente no `schemaMigrationService`?
- [ ] O novo campo em `CalculationModel` foi adicionado ao `modelSchema` (Zod) também?
- [ ] Testes para o novo fluxo foram adicionados em `__tests__/modelRepository.test.ts`?
