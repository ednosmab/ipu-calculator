# Instruções de refatoração — ipu-calculator

> Documento para execução por agente de IA.
> Execute cada tarefa na ordem indicada. Rode os testes após cada fase antes de continuar.
> Não altere lógica de negócio — apenas estrutura de arquivos e imports.

---

## Contexto do projeto

- React Native com Expo Router (file-based routing em `/app`)
- TypeScript
- Design system próprio em `src/design-system/`
- Estrutura feature-first em `src/features/`
- Alias `@/` aponta para `src/`

---

## Fase 1 — Limpeza (sem risco de quebra)

### Tarefa 1.1 — Atualizar `.gitignore`

Arquivo: `.gitignore`

Adicionar ao final do arquivo as seguintes entradas:

```
# Playwright
playwright-report/
test-results/

# Arquivos temporários e pessoais
scratch/
```

### Tarefa 1.2 — Deletar arquivos que não pertencem ao repositório

Executar os seguintes comandos:

```bash
git rm -r --cached playwright-report/
git rm -r --cached test-results/
git rm -r --cached scratch/
git commit -m "chore: remove build artifacts and scratch files from tracking"
```

Se os diretórios não estiverem no índice do git, apenas deletá-los do filesystem é suficiente.

### Tarefa 1.3 — Deletar `constants/theme.ts`

Este arquivo é o template padrão gerado pelo Expo e não é importado por nenhum arquivo do projeto. O tema real está em `src/design-system/theme.ts`.

```bash
git rm constants/theme.ts
git commit -m "chore: remove unused Expo default theme file (constants/theme.ts)"
```

**Verificação:** confirmar que nenhum arquivo importa de `@/constants/theme` ou `constants/theme`:
```bash
grep -r "constants/theme" src/ app/
# Resultado esperado: nenhuma linha
```

---

## Fase 2 — Consolidar componentes duplicados

### Contexto

Quatro componentes existem em dois lugares. A versão em `src/components/` é a correta e está em uso. A versão em `src/design-system/components/` é antiga, rasa, e não é importada diretamente por nenhuma tela.

**Exceção importante:** `_layout.tsx` importa `ErrorBoundary` via `@/design-system` (o barrel index). Isso precisa ser corrigido antes de deletar a versão do design-system.

Componentes duplicados:
- `src/components/ScreenLayout.tsx` ← versão correta (mantém)
- `src/components/ResultCard.tsx` ← versão correta (mantém)
- `src/components/ErrorBoundary.tsx` ← versão correta (mantém)
- `src/components/Title.tsx` ← versão correta (mantém)
- `src/design-system/components/ScreenLayout.tsx` ← deletar
- `src/design-system/components/ResultCard.tsx` ← deletar
- `src/design-system/components/ErrorBoundary.tsx` ← deletar
- `src/design-system/components/Title.tsx` ← deletar

### Tarefa 2.1 — Corrigir import de `ErrorBoundary` em `_layout.tsx`

Arquivo: `app/_layout.tsx`

**Antes** (linha 1):
```tsx
import { ErrorBoundary, Text, theme } from '@/design-system';
```

**Depois:**
```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Text, theme } from '@/design-system';
```

> Nota: `ErrorBoundary` em `src/components/ErrorBoundary.tsx` usa `captureError` do Sentry e tem botão "Tentar novamente". É a versão mais completa e deve ser preservada.

### Tarefa 2.2 — Remover `ErrorBoundary` do barrel do design-system

Arquivo: `src/design-system/index.ts`

**Antes:**
```ts
export * from './theme';
export * from './components/Button';
export * from './components/Input';
export * from './components/Card';
export * from './components/HStack';
export * from './components/VStack';
export * from './components/Toggle';
export * from './components/Text';
export * from './components/ErrorBoundary';
```

**Depois:**
```ts
export * from './theme';
export * from './components/Button';
export * from './components/Input';
export * from './components/Card';
export * from './components/HStack';
export * from './components/VStack';
export * from './components/Toggle';
export * from './components/Text';
```

### Tarefa 2.3 — Deletar os componentes duplicados do design-system

```bash
git rm src/design-system/components/ScreenLayout.tsx
git rm src/design-system/components/ResultCard.tsx
git rm src/design-system/components/ErrorBoundary.tsx
git rm src/design-system/components/Title.tsx
git commit -m "refactor: remove duplicate components from design-system, fix ErrorBoundary import in _layout"
```

**Verificação:** confirmar que nenhum arquivo importa das versões deletadas:
```bash
grep -r "design-system/components/ScreenLayout" src/ app/
grep -r "design-system/components/ResultCard" src/ app/
grep -r "design-system/components/ErrorBoundary" src/ app/
grep -r "design-system/components/Title" src/ app/
# Resultado esperado: nenhuma linha em nenhum dos quatro
```

---

## Fase 3 — Padronizar localização das screens

### Contexto

O projeto usa padrão feature-first, mas duas screens estão fora do padrão:

| Arquivo atual | Destino correto |
|---|---|
| `src/screens/HomeScreen.tsx` | `src/features/home/screens/HomeScreen.tsx` |
| `src/screens/ModelsScreen.tsx` | `src/features/models/screens/ModelsScreen.tsx` |

As screens de IPU e Calibração já estão corretamente em `src/features/ipu/screens/` e `src/features/calibration/screens/`.

### Tarefa 3.1 — Mover `HomeScreen`

1. Criar diretório `src/features/home/screens/`
2. Mover o arquivo:
   ```bash
   mkdir -p src/features/home/screens
   git mv src/screens/HomeScreen.tsx src/features/home/screens/HomeScreen.tsx
   ```
3. Atualizar o import em `app/index.tsx`:

**Antes:**
```tsx
import { HomeScreen } from '@/screens/HomeScreen';
```

**Depois:**
```tsx
import { HomeScreen } from '@/features/home/screens/HomeScreen';
```

### Tarefa 3.2 — Mover `ModelsScreen`

1. Criar o diretório de destino (já existe `src/features/models/`, adicionar `screens/`):
   ```bash
   mkdir -p src/features/models/screens
   git mv src/screens/ModelsScreen.tsx src/features/models/screens/ModelsScreen.tsx
   ```
2. Atualizar o import em `app/models.tsx`:

**Antes:**
```tsx
import { ModelsScreen } from '@/screens/ModelsScreen';
```

**Depois:**
```tsx
import { ModelsScreen } from '@/features/models/screens/ModelsScreen';
```

### Tarefa 3.3 — Remover `src/screens/` vazio

```bash
rmdir src/screens/
git add -A
git commit -m "refactor: move HomeScreen and ModelsScreen into feature directories, remove src/screens/"
```

**Verificação:**
```bash
grep -r "from '@/screens/" src/ app/
# Resultado esperado: nenhuma linha
```

---

## Fase 4 — Corrigir seletores frágeis no E2E

### Contexto

O teste `e2e/realtime-sync.spec.ts` falha porque usa `locator('text=E2E_SYNC_...')` para encontrar o card de modelo. O elemento existe no DOM mas o seletor de texto não é confiável neste contexto. A solução é adicionar `testID` nos elementos relevantes.

### Tarefa 4.1 — Adicionar `testID` no `ModelCard`

Arquivo: `src/features/models/components/ModelCard.tsx`

Localizar o `Pressable` ou `View` raiz do card e adicionar `testID`:

```tsx
// Encontrar o elemento raiz (Pressable ou TouchableOpacity) e adicionar:
testID={`model-card-${model.name}`}
```

Exemplo — se o componente for algo como:
```tsx
<Pressable onPress={...} style={...}>
```

Alterar para:
```tsx
<Pressable testID={`model-card-${model.name}`} onPress={...} style={...}>
```

### Tarefa 4.2 — Atualizar o seletor no teste E2E

Arquivo: `e2e/realtime-sync.spec.ts`

Localizar a asserção que verifica se o modelo criado por User A aparece para User B (em torno da linha 116). Ela usa algo como:

```ts
await expect(pageB.locator(`text=${MODEL_NAME}`)).toBeVisible({ timeout: 15000 });
```

Substituir por:

```ts
await expect(pageB.getByTestId(`model-card-${MODEL_NAME}`)).toBeVisible({ timeout: 15000 });
```

Aplicar o mesmo padrão para qualquer outro seletor de texto frágil no mesmo arquivo que referencie nomes de modelos criados dinamicamente.

```bash
git add -A
git commit -m "fix(e2e): replace fragile text selectors with testID in realtime sync spec"
```

---

## Resumo dos commits esperados

Ao final da refatoração, o histórico deve ter os seguintes commits (nesta ordem):

```
chore: remove build artifacts and scratch files from tracking
chore: remove unused Expo default theme file (constants/theme.ts)
refactor: remove duplicate components from design-system, fix ErrorBoundary import in _layout
refactor: move HomeScreen and ModelsScreen into feature directories, remove src/screens/
fix(e2e): replace fragile text selectors with testID in realtime sync spec
```

---

## Verificação final

Após todas as fases, confirmar:

```bash
# 1. Sem imports de src/screens/
grep -r "from '@/screens/" src/ app/
# esperado: sem resultado

# 2. Sem imports dos componentes deletados do design-system
grep -r "design-system/components/ScreenLayout\|design-system/components/ResultCard\|design-system/components/ErrorBoundary\|design-system/components/Title" src/ app/
# esperado: sem resultado

# 3. constants/theme.ts não existe mais
ls constants/theme.ts
# esperado: No such file or directory

# 4. Diretório src/screens/ não existe mais
ls src/screens/
# esperado: No such file or directory

# 5. Screens movidas estão nos destinos corretos
ls src/features/home/screens/HomeScreen.tsx
ls src/features/models/screens/ModelsScreen.tsx
# esperado: arquivos existem
```
