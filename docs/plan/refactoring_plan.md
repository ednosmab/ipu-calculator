# Plano de Refatoração — IPU Calculator

## Escopo e princípio

Quatro problemas reais, cirúrgicos. Sem reescrita de arquitetura — a base está sólida.
Cada etapa é independente, pode ser executada em PR separado e validada isoladamente.

---

## Etapa 1 — Corrigir erros TypeScript

**Branch sugerida:** `fix/ts-errors`  
**Estimativa:** 1–2h  
**Risco:** baixo

O `ts-errors.log` contém 15 erros. Agrupados por causa raiz:

---

### 1.1 — Importação de `View` inexistente no design system

**Arquivo:** `app/_layout.tsx:2`  
**Erro:** `Module '"@/design-system"' has no exported member 'View'`

O `View` não é exportado por `src/design-system/index.ts` (correto — é um primitivo do RN, não um componente do DS).

**Correção:**
```tsx
// Antes (linha 2 do _layout.tsx)
import { ErrorBoundary, Text, theme, View } from '@/design-system';

// Depois
import { View } from 'react-native';
import { ErrorBoundary, Text, theme } from '@/design-system';
```

---

### 1.2 — Testes do componente `Text` usando props removidas

**Arquivo:** `src/design-system/__tests__/Text.test.tsx` (linhas 19, 24, 29, 34)  
**Erros:** props `size`, `muted`, `color` não existem em `TextProps`

O componente `Text` atual aceita apenas `variant` e `weight`. Os testes foram escritos para uma versão anterior do componente.

**Correção — atualizar os testes para refletir a API atual:**
```tsx
// Antes — props que não existem
render(<Text size="lg">Texto</Text>)
render(<Text muted>Texto</Text>)
render(<Text color="red">Texto</Text>)

// Depois — props corretas
render(<Text variant="label">Texto de rótulo</Text>)
render(<Text variant="helper">Texto de ajuda</Text>)
render(<Text variant="error">Texto de erro</Text>)
```

Os casos de teste para `size`, `muted` e `color` devem ser substituídos por casos que testem `variant` e `weight` — os únicos controles reais do componente.

---

### 1.3 — `Header.tsx` usando variant `"title"` inexistente

**Arquivo:** `src/design-system/components/Header.tsx:14`  
**Erro:** `Type '"title"' is not assignable to type '"error" | "body" | "label" | "helper" | undefined'`

**Correção — opção A (preferida):** usar o componente `Title` já existente no DS, como o próprio `ScreenLayout` faz:
```tsx
// Antes
<Text variant="title">{title}</Text>

// Depois
import { Title } from './Title';
<Title>{title}</Title>
```

**Correção — opção B:** se precisar de `Text` com estilo de título, usar `weight="bold"` + `style` explícito.

---

### 1.4 — `ScreenLayout` passando prop `align` que não existe em `VStack`

**Arquivo:** `src/design-system/components/ScreenLayout.tsx:17`  
**Erro:** `Property 'align' does not exist on type 'IntrinsicAttributes & Props'`

O `VStack` aceita apenas `children`, `gap` e `style`. A prop `align` foi passada mas nunca foi adicionada ao tipo.

**Correção:** mover o alinhamento para dentro do `style`:
```tsx
// Antes
<VStack gap="lg" style={{ flex: 1 }} align={centered ? 'center' : undefined}>

// Depois
<VStack gap="lg" style={[{ flex: 1 }, centered && { alignItems: 'center' }]}>
```

---

### 1.5 — `HomeScreen` usando variant `"ghost"` no `Button`

**Arquivo:** `src/screens/HomeScreen.tsx:40`  
**Erro:** `Type '"ghost"' is not assignable to type '"primary" | "secondary" | undefined'`

O `Button` só tem `primary` e `secondary`. `ghost` não existe.

**Correção — opção A:** usar `variant="secondary"` (comportamento visual mais próximo).

**Correção — opção B (se o visual for diferente):** adicionar `ghost` como variante real ao `Button`:
```tsx
// Button.tsx — adicionar ao tipo Props
variant?: 'primary' | 'secondary' | 'ghost';

// Adicionar estilo ghost
ghost: {
  backgroundColor: 'transparent',
  borderColor: 'transparent',
},
```
Decidir com base no design: se `ghost` é visual e funcionalmente diferente de `secondary`, implementar a variante. Se são equivalentes, trocar por `secondary`.

---

### 1.6 — `HistoryList` com indexação implícita em union type

**Arquivo:** `src/components/HistoryList.tsx:35-36`  
**Erro:** `Element implicitly has an 'any' type because expression of type 'string' can't be used to index type`

O tipo de `inputs` no `CalculationHistory` é uma union de shapes específicos, mas o código acessa com índice de string genérico.

**Correção:**
```tsx
// Antes
const label1 = displayLabels[key1] ?? key1;

// Depois — cast explícito já que displayLabels é Record<string, string>
const label1 = (displayLabels as Record<string, string>)[key1] ?? key1;

// Ou melhor, tipar displayLabels diretamente na desestruturação:
const displayLabels = (labels ?? defaultLabels) as Record<string, string>;
// (o cast já está na linha 27, mas o TS não está infirindo para as linhas 35-36)
// Solução: usar a variável displayLabels (já tipada) em vez de re-acessar
```

A solução mais limpa é garantir que `formatInputs` receba `Record<string, string>` como parâmetro explícito, em vez de depender do closure.

---

### 1.7 — `calculationModel.ts` erro `Expected 2-3 arguments, but got 1`

**Arquivo:** `src/features/models/domain/calculationModel.ts:18`  
**Erro:** `TS2554: Expected 2-3 arguments, but got 1`

O erro aponta para `z.object({...})` na linha 18. Provavelmente uma versão do Zod no ambiente espera parâmetros adicionais, ou há uma chamada encadeada incompleta em outro lugar que o TS está atribuindo a essa linha. Verificar se o erro não vem de algum `.parse()` ou `.safeParse()` chamado sem argumentos em algum teste que aponta para esse schema.

**Ação:** rodar `npx tsc --noEmit` localmente e verificar se o erro persiste com a versão atual de `zod` instalada. Se persistir, inspecionar a call stack real.

---

### 1.8 — `TS7017` nos arquivos de teste (`__ExpoImportMetaRegistry`)

**Arquivos:** `Button.test.tsx`, `Card.test.tsx`, `Input.test.tsx`, `Text.test.tsx`, `useCalculatorLogic.test.ts`  
**Erro:** `Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature`

O hack de polyfill `(global as any).__ExpoImportMetaRegistry` está sendo repetido em cada arquivo de teste.

**Correção:** mover para `jest.setup.js` (já existe no projeto) e remover de cada teste individualmente:
```js
// jest.setup.js — adicionar
global.__ExpoImportMetaRegistry = global.__ExpoImportMetaRegistry || {};
global.structuredClone = global.structuredClone || ((val) => JSON.parse(JSON.stringify(val)));
```

Remover os dois `(global as any)` de cada arquivo de teste após isso.

---

### Validação da Etapa 1

```bash
npx tsc --noEmit        # zero erros
npm test                # 85 testes passando
npm run lint            # sem warnings
```

Deletar `ts-errors.log` ao concluir.

---

## Etapa 2 — Implementar o sistema de cache versioning

**Branch sugerida:** `feat/cache-versioning`  
**Estimativa:** 3–4h  
**Risco:** médio (toca em storage — validar bem com testes)  
**Pré-requisito:** Etapa 1 concluída

Conforme detalhado no `docs/roadmap_cache_versioning.md`. Resumo de execução:

### 2.1 — Criar `src/core/versioning/cacheVersion.ts`

```ts
export const CACHE_VERSION = {
  SCHEMA: '2.0.0',
  SW: process.env.EXPO_PUBLIC_APP_VERSION ?? 'dev',
  MODEL_TTL_MS: 48 * 60 * 60 * 1000,
} as const;
```

### 2.2 — Adicionar `CACHE_VERSION` em `storageKeys.ts`

```ts
CACHE_VERSION: '@ipu:cache_version',
```

### 2.3 — Atualizar `CacheMetadata` em `modelRepository.ts`

Adicionar `schemaVersion: string` à interface e gravar em `saveWithTTL`. Validar em `getAll` antes do TTL.

### 2.4 — Remover `MODEL_TTL_MS` duplicado de `fetchRemoteModelsUseCase.ts`

Substituir pela importação de `cacheVersion.ts`. Enquanto estiver nesse arquivo: corrigir o write direto (ver Etapa 3).

### 2.5 — Refatorar `schemaMigrationService`

Cobrir migração do formato legado (`CalculationModel[]` → `CacheMetadata`) e usar `STORAGE_KEYS.CACHE_VERSION` como chave global de versão.

### 2.6 — Automatizar versão do Service Worker

Substituir `'ipu-calc-v7'` por `'ipu-calc-__APP_VERSION__'` e criar `scripts/inject-sw-version.js` com hook no `postbuild`.

### Validação da Etapa 2

```bash
npm test -- --testPathPattern="modelRepository|schemaMigration"
# Testar manualmente:
# 1. Limpar AsyncStorage → abrir app → dados carregam corretamente
# 2. Injetar cache com schemaVersion antiga → confirmar que retorna [] e não crasha
# 3. Build web → verificar nome do cache no DevTools > Application > Cache Storage
```

---

## Etapa 3 — Corrigir write direto em `fetchRemoteModelsUseCase`

**Branch sugerida:** `fix/fetch-remote-bypass` (pode ir junto com a Etapa 2)  
**Estimativa:** 30min  
**Risco:** baixo

### Problema

`fetchRemoteModelsUseCase.ts` termina com:
```ts
await asyncStorageClient.set(STORAGE_KEYS.MODELS, {
  data: updated,
  expiresAt: Date.now() + MODEL_TTL_MS,
});
```

Isso contorna o `modelRepository.saveWithTTL()` e o mutex de escrita. Com o cache versioning da Etapa 2, esse write também não incluiria `schemaVersion`.

### Correção

Substituir o write direto pela chamada ao repositório:
```ts
// Antes
await asyncStorageClient.set(STORAGE_KEYS.MODELS, {
  data: updated,
  expiresAt: Date.now() + MODEL_TTL_MS,
});

// Depois
await modelRepository.saveWithTTL(updated);
```

Isso centraliza toda escrita no repositório, garante o mutex e o `schemaVersion` automaticamente.

### Validação da Etapa 3

```bash
npm test -- --testPathPattern="fetchRemoteModels|modelRepository"
# Testar: sync completo online → dados salvos corretamente
# Testar: sync com dados pendentes → pending preservados após fetch remoto
```

---

## Etapa 4 — Quebrar `ModelsScreen.tsx` (530 linhas)

**Branch sugerida:** `refactor/models-screen`  
**Estimativa:** 3–4h  
**Risco:** médio (muita lógica de UI — testar cada interação manualmente)  
**Pré-requisito:** Etapas 1 e 2 concluídas (ambiente TypeScript limpo)

### Estrutura atual (tudo no mesmo arquivo)

```
ModelsScreen (530 linhas)
├── 11 useState / useRef
├── lógica de modal (create/edit/editTime)
├── lógica de delete com debounce
├── lógica de busca + filtro
├── lógica de animação (fadeAnim)
├── renderList() inline
├── renderSkeleton() inline
├── Modal de edição (JSX de ~50 linhas)
├── Modal de confirmação de delete (JSX de ~20 linhas)
└── FAB button
```

### Estrutura proposta

Tudo dentro de `src/features/models/` — não criar pasta nova:

```
src/features/models/
  screens/
    ModelsScreen.tsx          ← orquestrador, ~120 linhas
  components/
    ModelCard.tsx             ← card individual com badges + ações
    ModelList.tsx             ← lista filtrada por tipo
    ModelFormModal.tsx        ← modal de create/edit com inputs
    ModelDeleteModal.tsx      ← modal de confirmação de delete
    ModelSkeleton.tsx         ← skeleton de loading (já existe parcialmente)
  hooks/
    useModelForm.ts           ← estados e handlers do formulário (name, time, errors, save)
    useRealtimeModels.ts      ← já existe, não alterar
```

### Extração recomendada por ordem

**Passo 1 — `useModelForm.ts`**

Extrair os 8 estados de formulário e as funções `openCreate`, `openEdit`, `openEditTime`, `handleSave`, `handleModalClose`:

```ts
export const useModelForm = (models: CalculationModel[]) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [isTimeOnly, setIsTimeOnly] = useState(false);
  const [editingModel, setEditingModel] = useState<CalculationModel | null>(null);
  const [modelName, setModelName] = useState('');
  const [nameError, setNameError] = useState('');
  const [injectionTime, setInjectionTime] = useState('');
  const [timeError, setTimeError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => { ... };
  const openEdit = (model: CalculationModel) => { ... };
  const openEditTime = (model: CalculationModel) => { ... };
  const handleSave = async () => { ... };
  const handleModalClose = () => { ... };

  return { modalVisible, isTimeOnly, editingModel, modelName, nameError,
           injectionTime, timeError, isSaving, openCreate, openEdit,
           openEditTime, handleSave, handleModalClose, setModelName,
           setInjectionTime };
};
```

**Passo 2 — `ModelCard.tsx`**

Extrair o JSX de cada card (badges `Novo`/`Editado`, botões de editar/excluir):

```tsx
type Props = {
  model: CalculationModel;
  onEdit: (model: CalculationModel) => void;
  onEditTime: (model: CalculationModel) => void;
  onDelete: (model: CalculationModel) => void;
  onSelect: (model: CalculationModel) => void;
};
export const ModelCard = ({ model, onEdit, onEditTime, onDelete, onSelect }: Props) => { ... };
```

**Passo 3 — `ModelFormModal.tsx`**

Extrair o `<RNModal>` de edição (~50 linhas de JSX + inputs):

```tsx
type Props = {
  visible: boolean;
  isTimeOnly: boolean;
  editingModel: CalculationModel | null;
  modelName: string;
  nameError: string;
  injectionTime: string;
  timeError: string;
  isSaving: boolean;
  onChangeName: (v: string) => void;
  onChangeTime: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
};
export const ModelFormModal = (props: Props) => { ... };
```

**Passo 4 — `ModelDeleteModal.tsx`**

Extrair o `<RNModal>` de confirmação de delete:

```tsx
type Props = {
  model: CalculationModel | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};
export const ModelDeleteModal = ({ model, isDeleting, onConfirm, onCancel }: Props) => { ... };
```

**Passo 5 — `ModelList.tsx`**

Extrair `renderList()` como componente:

```tsx
type Props = {
  models: CalculationModel[];
  type: ModelType;
  search: string;
  onEdit: (m: CalculationModel) => void;
  onEditTime: (m: CalculationModel) => void;
  onDelete: (m: CalculationModel) => void;
  onSelect: (m: CalculationModel) => void;
};
export const ModelList = (props: Props) => { ... };
```

**Passo 6 — `ModelsScreen.tsx` resultante (~120 linhas)**

O orquestrador final apenas compõe os componentes e hooks:

```tsx
export const ModelsScreen = ({ onGoBack, onSelectModel }: Props) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { toast, success, error } = useToast();
  const { models, isLoading } = useRealtimeModels();
  const form = useModelForm(models);
  const deleteState = useModelDelete(); // extraído dos handlers de delete

  // JSX limpo com componentes extraídos
  return (
    <ScreenLayout ...>
      <ModelList models={ipuModels} type="ipu" ... />
      <ModelList models={calibrationModels} type="calibration" ... />
      <ModelFormModal {...form} />
      <ModelDeleteModal {...deleteState} />
    </ScreenLayout>
  );
};
```

### Validação da Etapa 4

**Smoke tests obrigatórios após cada extração (não só no final):**

- [ ] Criar modelo → salva e aparece na lista
- [ ] Editar nome → atualiza
- [ ] Editar tempo → atualiza apenas o tempo
- [ ] Deletar → confirmação aparece → modelo some
- [ ] Busca filtra corretamente
- [ ] Badge `Novo` aparece em modelo criado offline
- [ ] Badge `Editado` aparece após edição
- [ ] Animação de fade-in ao carregar lista
- [ ] Skeleton aparece durante loading

```bash
npm test -- --testPathPattern="ModelsScreen|useRealtimeModels|modelRepository"
```

---

## Ordem de execução recomendada

```
Etapa 1 (TypeScript)
    ↓
Etapa 2 + Etapa 3 (cache versioning + fix write direto — mesmo PR)
    ↓
Etapa 4 (ModelsScreen)
```

As etapas 2 e 3 andam juntas porque a Etapa 3 depende do `modelRepository.saveWithTTL()` já incluir `schemaVersion` (implementado na Etapa 2).

A Etapa 4 é independente das anteriores em termos de lógica, mas é mais seguro ter o ambiente TypeScript limpo antes de refatorar 530 linhas.

---

## Critérios de conclusão

- [ ] `npx tsc --noEmit` → 0 erros
- [ ] `npm test` → 85+ testes passando (zero skipped adicionais)
- [ ] `ts-errors.log` deletado do repositório
- [ ] `ModelsScreen.tsx` abaixo de 150 linhas
- [ ] `fetchRemoteModelsUseCase` sem write direto ao AsyncStorage
- [ ] Cache do Service Worker com versão derivada do `package.json`
- [ ] Smoke tests completos executados no staging antes do merge para main
