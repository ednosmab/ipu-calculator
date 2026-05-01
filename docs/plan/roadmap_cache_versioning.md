# Roadmap — Cache Versioning System (IPU Calculator)

## 🎯 Objetivo

Implementar um sistema de versionamento de cache robusto para garantir que mudanças de schema, atualizações de app e deploys não deixem dados corrompidos ou stale no dispositivo do usuário — tanto no AsyncStorage (mobile/web) quanto no Service Worker Cache (PWA).

---

## 📊 Diagnóstico do estado atual

| Camada | Situação atual | Problema |
|---|---|---|
| `service-worker.js` | `CACHE_NAME = 'ipu-calc-v7'` hardcoded | Versão manual, fora de sincronia com o app |
| `asyncStorageClient` | Sem campo de versão nos dados | Impossível detectar schema antigo em runtime |
| `schemaMigrationService` | `SCHEMA_VERSION = '1.0.0'` isolado | Só cobre modelos, não os demais STORAGE_KEYS |
| `modelRepository` | `CacheMetadata` só tem `data` e `expiresAt` | Sem `schemaVersion` no payload do cache |
| `fetchRemoteModelsUseCase` | `MODEL_TTL_MS` duplicado (48h) | Constante duplicada entre dois arquivos |
| `storageKeys.ts` | Sem chave `CACHE_VERSION` global | Não existe verdade única da versão em runtime |

---

## 🧱 Fase 1 — Fonte única de verdade para versões

**Objetivo:** criar um módulo central que define todas as versões, eliminando constantes duplicadas.

### Arquivo novo: `src/core/versioning/cacheVersion.ts`

```ts
export const CACHE_VERSION = {
  // Versão do schema do AsyncStorage — incrementar ao mudar estrutura de dados
  SCHEMA: '2.0.0',

  // Versão do Service Worker Cache — deve ser derivada do build
  SW: process.env.EXPO_PUBLIC_APP_VERSION ?? 'dev',

  // TTL do cache de modelos (única declaração)
  MODEL_TTL_MS: 48 * 60 * 60 * 1000,
} as const;
```

### Tarefas

- [ ] Criar `src/core/versioning/cacheVersion.ts`
- [ ] Remover `SCHEMA_VERSION` de `schemaMigrationService.ts` → importar de `cacheVersion.ts`
- [ ] Remover `MODEL_TTL_MS` de `fetchRemoteModelsUseCase.ts` e `modelRepository.ts` → importar de `cacheVersion.ts`
- [ ] Adicionar `EXPO_PUBLIC_APP_VERSION` ao `.env` e ao `eas.json` (lido em build time)
- [ ] Adicionar `CACHE_VERSION` key em `storageKeys.ts`:
  ```ts
  CACHE_VERSION: '@ipu:cache_version',
  ```

---

## 🧱 Fase 2 — Versão no payload do AsyncStorage

**Objetivo:** todo objeto salvo no AsyncStorage deve carregar sua versão de schema, permitindo detecção e migração automática.

### Mudança no tipo `CacheMetadata` (modelRepository)

```ts
// Antes
interface CacheMetadata {
  data: CalculationModel[];
  expiresAt: number;
}

// Depois
interface CacheMetadata {
  data: CalculationModel[];
  expiresAt: number;
  schemaVersion: string; // novo campo obrigatório
}
```

### Mudança em `saveWithTTL`

```ts
async saveWithTTL(data: CalculationModel[]): Promise<boolean> {
  const cache: CacheMetadata = {
    data,
    expiresAt: Date.now() + CACHE_VERSION.MODEL_TTL_MS,
    schemaVersion: CACHE_VERSION.SCHEMA, // adicionado
  };
  return asyncStorageClient.set(STORAGE_KEYS.MODELS, cache);
},
```

### Mudança em `getAll`

```ts
async getAll(forceRefresh = false): Promise<CalculationModel[]> {
  const cached = await asyncStorageClient.get<CacheMetadata>(STORAGE_KEYS.MODELS);

  if (!cached) return [];

  // Detecta schema incompatível antes de verificar TTL
  if (cached.schemaVersion !== CACHE_VERSION.SCHEMA) {
    logger.warn('[modelRepository] Schema desatualizado — invalidando cache');
    await asyncStorageClient.remove(STORAGE_KEYS.MODELS);
    return [];
  }

  if (cached.expiresAt && this.isExpired(cached.expiresAt)) { ... }

  return cached.data ?? [];
},
```

### Tarefas

- [ ] Adicionar `schemaVersion` à interface `CacheMetadata`
- [ ] Atualizar `saveWithTTL` para gravar `schemaVersion`
- [ ] Atualizar `getAll` para validar `schemaVersion` antes do TTL
- [ ] Atualizar `fetchRemoteModelsUseCase` — o `asyncStorageClient.set` direto no final também deve incluir `schemaVersion`
- [ ] Atualizar `schemaMigrationService.getModels` / `saveModels` para ler/escrever no novo formato `CacheMetadata` (atualmente trata `STORAGE_KEYS.MODELS` como `CalculationModel[]` puro — **quebra** com a nova estrutura)

---

## 🧱 Fase 3 — Service Worker Cache sincronizado com o build

**Objetivo:** o `CACHE_NAME` do Service Worker deve ser gerado automaticamente no build, não editado manualmente.

### Mudança em `public/service-worker.js`

```js
// Substituir hardcoded:
// const CACHE_NAME = 'ipu-calc-v7';

// Por variável injetada no build (via Vite/Webpack/Expo):
const CACHE_NAME = 'ipu-calc-__APP_VERSION__';
```

### Estratégia de injeção

- **Expo + Metro:** criar um script `scripts/inject-sw-version.js` que roda como `postbuild`, substituindo `__APP_VERSION__` pelo valor de `EXPO_PUBLIC_APP_VERSION`
- **Alternativa simples:** usar o hash do último commit git como versão: `git rev-parse --short HEAD`

### Exemplo de script `scripts/inject-sw-version.js`

```js
const fs = require('fs');
const version = process.env.EXPO_PUBLIC_APP_VERSION || require('../package.json').version;
const swPath = './public/service-worker.js';
const content = fs.readFileSync(swPath, 'utf8');
fs.writeFileSync(swPath, content.replace('__APP_VERSION__', version));
console.log(`[SW] Cache name set to: ipu-calc-${version}`);
```

### Tarefas

- [ ] Substituir `'ipu-calc-v7'` por `'ipu-calc-__APP_VERSION__'` em `service-worker.js`
- [ ] Criar `scripts/inject-sw-version.js`
- [ ] Adicionar ao `package.json`:
  ```json
  "scripts": {
    "postbuild": "node scripts/inject-sw-version.js"
  }
  ```
- [ ] Garantir que `EXPO_PUBLIC_APP_VERSION` é definido no CI (`ci.yml`)

---

## 🧱 Fase 4 — Migração ampliada no `schemaMigrationService`

**Objetivo:** estender o serviço de migração para cobrir todos os storage keys relevantes, não só modelos.

### Novo contrato do `schemaMigrationService`

```ts
async migrateIfNeeded(): Promise<{ migrated: boolean; count: number }> {
  const savedVersion = await asyncStorageClient.get<string>(STORAGE_KEYS.CACHE_VERSION);

  if (savedVersion === CACHE_VERSION.SCHEMA) {
    return { migrated: false, count: 0 };
  }

  logger.info(`[Migration] Migrando de ${savedVersion ?? 'null'} → ${CACHE_VERSION.SCHEMA}`);

  let count = 0;

  // Migração de modelos: adapta formato antigo (array puro) → CacheMetadata
  const raw = await asyncStorageClient.get<unknown>(STORAGE_KEYS.MODELS);
  if (Array.isArray(raw)) {
    // Formato legado: era CalculationModel[] direto
    await asyncStorageClient.set(STORAGE_KEYS.MODELS, {
      data: raw,
      expiresAt: 0, // força refresh imediato
      schemaVersion: CACHE_VERSION.SCHEMA,
    });
    count += raw.length;
  }

  // Futuras migrações entram aqui como novas seções

  await asyncStorageClient.set(STORAGE_KEYS.CACHE_VERSION, CACHE_VERSION.SCHEMA);

  return { migrated: true, count };
},
```

### Tarefas

- [ ] Refatorar `schemaMigrationService` para usar `STORAGE_KEYS.CACHE_VERSION` (em vez de `STORAGE_KEYS.SCHEMA_VERSION`)
- [ ] Adicionar migração de formato legado (array puro → `CacheMetadata`)
- [ ] Remover `STORAGE_KEYS.SCHEMA_VERSION` após migrar (ou manter como alias por uma versão)
- [ ] Adicionar testes unitários para a migração de formato legado

---

## 🧱 Fase 5 — Testes e observabilidade

**Objetivo:** garantir que o sistema de versioning não quebre silenciosamente.

### Testes unitários novos

| Arquivo | Cenário |
|---|---|
| `modelRepository.test.ts` | Cache com `schemaVersion` errado → retorna `[]` e limpa storage |
| `modelRepository.test.ts` | Cache com `schemaVersion` correta → retorna dados normalmente |
| `schemaMigrationService.test.ts` | Formato legado (array puro) → migrado para `CacheMetadata` |
| `schemaMigrationService.test.ts` | Versão já atual → `migrated: false` sem tocar nos dados |

### Observabilidade

Adicionar ao `logger` as seguintes mensagens padronizadas para facilitar debug em produção:

```
[CacheVersion] Schema atual: 2.0.0
[CacheVersion] Cache invalidado — schema incompatível (1.0.0 → 2.0.0)
[CacheVersion] Migração concluída: N itens atualizados
[SW] Cache ativo: ipu-calc-1.4.2
```

---

## 🚀 Ordem de execução recomendada

1. **Fase 1** — criar `cacheVersion.ts` e consolidar constantes (sem quebra de comportamento)
2. **Fase 4** — refatorar `schemaMigrationService` (depende da Fase 1)
3. **Fase 2** — adicionar `schemaVersion` ao `CacheMetadata` (com migração pronta da Fase 4)
4. **Fase 3** — automatizar versionamento do Service Worker (independente, pode rodar em paralelo)
5. **Fase 5** — testes e logs (contínua, idealmente junto de cada fase)

---

## ⚠️ Pontos de atenção

- **Não incrementar `SCHEMA_VERSION` sem uma migração correspondente na Fase 4.** Incrementar a versão sem migração apaga os dados do usuário silenciosamente.
- **`fetchRemoteModelsUseCase` escreve diretamente no AsyncStorage** (linha final do use case), contornando `modelRepository.saveWithTTL`. Essa escrita direta precisa ser atualizada para incluir `schemaVersion`, ou melhor, substituída por uma chamada ao próprio repositório.
- **`schemaMigrationService.getModels`** lê `STORAGE_KEYS.MODELS` como `CalculationModel[]` puro. Isso quebra com o novo formato `CacheMetadata`. A Fase 4 corrige isso — deve ser implementada antes ou junto da Fase 2.
