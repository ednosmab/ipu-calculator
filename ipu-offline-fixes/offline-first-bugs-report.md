# Relatório de Bugs — Offline-First (`ipu-calculator`)

**Data:** 2026-04-30  
**Branch analisada:** `develop`  
**Escopo:** Comportamento intermitente no modo offline-first

---

## Resumo Executivo

Foram identificados **4 bugs** que, em conjunto, explicam o comportamento intermitente do modo offline-first. Os bugs #1 e #2 são os mais críticos: dependem de timing de rede no momento da abertura do app, o que gera falhas não-determinísticas difíceis de reproduzir manualmente.

---

## Bug #1 — `fetchRemoteModelsUseCase` apaga modelos locais durante o merge

**Severidade:** 🔴 Alta  
**Arquivo:** `src/features/models/application/fetchRemoteModelsUseCase.ts`

### Descrição

A variável `updated` era inicializada como um array vazio `[]`. O merge com os dados remotos partia do zero, ignorando completamente os modelos que já existiam no storage local com `syncStatus: 'synced'`.

Como consequência, qualquer modelo local que não estivesse presente na resposta do Supabase naquele instante (ex: resposta parcial, latência, modelo criado offline ainda não confirmado) era silenciosamente removido do storage.

### Código original (problemático)

```ts
let updated: CalculationModel[] = []; // ← começa vazio

for (const rm of remoteModels) {
  const localIndex = updated.findIndex(m => m.id === rm.id);
  // ...
}

const pendingModels = localModels.filter(m => m.syncStatus === 'pending');
updated = [...updated, ...pendingModels]; // ← só preserva 'pending', perde 'synced'
```

### Correção aplicada

```ts
// Começa com os modelos locais como base
let updated: CalculationModel[] = [...localModels];

// Remote sobrescreve apenas se for mais recente
for (const rm of remoteModels) { ... }

// Remove somente 'synced' que não existem mais no remote
updated = updated.filter(m =>
  m.syncStatus === 'pending' || remoteIds.has(m.id)
);
```

---

## Bug #2 — `modelRepository.create` não registra na fila de pendentes quando offline

**Severidade:** 🔴 Alta  
**Arquivo:** `src/features/models/infra/modelRepository.ts`

### Descrição

Quando o sync remoto falhava durante um `create` (ex: sem conexão), o modelo era salvo localmente com `syncStatus: 'pending'`, mas **não era adicionado ao `pendingOpsService`**.

O `processPendingEditsUseCase` — que implementa retry com contador de tentativas — opera exclusivamente sobre a fila do `pendingOpsService`. Ao não registrar o modelo nessa fila, as criações feitas offline nunca eram sincronizadas quando a conexão voltava.

O `syncModelsUseCase` até varria modelos `pending` do storage, mas sem o controle de `attempts`, `lastAttempt` e `MAX_ATTEMPTS` que o `processPendingEditsUseCase` oferece.

### Código original (problemático)

```ts
async create(model: CalculationModel): Promise<boolean> {
  return withWriteLock(async () => {
    const isSynced = await modelSyncService.syncToRemote(model);

    const modelWithStatus: CalculationModel = {
      ...model,
      syncStatus: isSynced ? 'synced' : 'pending',
      localAction: isSynced ? null : 'created',
      // ← sem registro no pendingOpsService quando offline
    };
    // ...
  });
},
```

### Correção aplicada

```ts
if (!isSynced) {
  const pending = createPendingOperation('create', modelWithStatus);
  await pendingOpsService.addPendingEdit(pending);
}
```

---

## Bug #3 — `useSyncEngine` pode ignorar o evento `online` após reconexão rápida

**Severidade:** 🟡 Média  
**Arquivo:** `src/hooks/useSyncEngine.ts`

### Descrição

O flag `isFirstRun` era setado para `false` **dentro** do handler `handleOnline`. A função `init()` — que roda o sync inicial — não alterava esse flag.

Fluxo problemático:
1. App abre com conexão → `init()` roda e completa, `isFirstRun` continua `true`
2. Conexão cai e volta em menos de alguns segundos
3. `handleOnline` dispara → verifica `if (!isFirstRun.current)` → condição é `false` → **sync não roda**
4. `isFirstRun` é setado para `false` só agora — tarde demais

### Correção aplicada

`isFirstRun.current = false` foi movido para o bloco `finally` do `init()`, garantindo que seja marcado como concluído independentemente de sucesso ou falha.

```ts
} finally {
  isFirstRun.current = false;
}
```

O `handleOnline` foi simplificado, removendo a linha redundante de reset do flag.

---

## Bug #4 — Service Worker usa estratégia `cache-first` sem cachear bundles dinâmicos

**Severidade:** 🟡 Média  
**Arquivo:** `public/service-worker.js`

### Descrição

A lista `ASSETS_TO_CACHE` do evento `install` continha apenas 4 assets estáticos (`/`, `/index.html`, `/manifest.json`, `/icon.png`). Os bundles JS e CSS gerados dinamicamente pelo Metro/Expo **não eram cacheados proativamente**.

Com a estratégia `cache-first`, um request para um bundle que não estava no cache simplesmente falhava offline — sem fallback para o `index.html` nem para um shell funcional. Isso explica o comportamento "às vezes abre, às vezes não": o app só funcionava offline se o usuário tivesse visitado todas as rotas necessárias previamente com conexão ativa.

### Correção aplicada

Mudança para estratégia **Network-first com fallback para cache**:

- Online: serve da rede e atualiza o cache em paralelo (sempre fresco)
- Offline: serve do cache; se não encontrar, faz fallback para `index.html` (SPA shell)
- Requests `POST/PUT/DELETE` e requests para `supabase.co` são ignorados pelo SW
- Versão do cache atualizada para `ipu-calc-v7` para forçar re-instalação

---

## Tabela de Impacto

| # | Arquivo | Severidade | Sintoma visível |
|---|---------|-----------|-----------------|
| 1 | `fetchRemoteModelsUseCase.ts` | 🔴 Alta | Modelos somem após sync remoto |
| 2 | `modelRepository.ts` | 🔴 Alta | Criações offline nunca sincronizam |
| 3 | `useSyncEngine.ts` | 🟡 Média | Sync não roda após reconexão rápida |
| 4 | `service-worker.js` | 🟡 Média | App não abre offline em alguns cenários |

---

## Arquivos Modificados

```
public/service-worker.js
src/features/models/application/fetchRemoteModelsUseCase.ts
src/features/models/infra/modelRepository.ts
src/hooks/useSyncEngine.ts
```

---

## Recomendações Adicionais (fora do escopo das correções)

- **Testes de integração offline:** simular `navigator.onLine = false` nos testes do `useSyncEngine` e `modelRepository` para cobrir os cenários de reconexão
- **Indicador visual de `pending`:** já existe `syncStatus` no modelo — expor isso na UI com um ícone de "sincronização pendente" melhora muito a experiência offline
- **TTL mais granular:** o TTL de 48h do cache é aplicado mesmo após um merge parcial; considerar atualizar o `expiresAt` apenas quando o fetch remoto for bem-sucedido

