# Plano de Refatoração — ipu-calculator

> Gerado em: 2026-05-02
> Base analisada: `ipu-calculator-refactor` (branch atual)

---

## Diagnóstico

### P1 — Componentes duplicados *(crítico)*

Quatro componentes existem simultaneamente em dois diretórios:

| Componente | `src/components/` | `src/design-system/components/` |
|---|---|---|
| `ScreenLayout` | ✅ Versão completa (SafeAreaView, scroll, offline icon, header) | ⚠️ Versão rasa (sem SafeArea, sem scroll, props diferentes) |
| `ResultCard` | ✅ Versão usada pelas telas | ⚠️ Versão alternativa não usada |
| `ErrorBoundary` | ✅ Versão usada pelo layout | ⚠️ Versão duplicada |
| `Title` | ✅ Versão usada pelo `ScreenLayout` real | ⚠️ Versão duplicada |

O app inteiro já importa de `@/components/...`. As versões do `design-system/components/` não são importadas por ninguém e representam um estado anterior abandonado da refatoração.

**Risco:** qualquer dev novo pode importar da fonte errada e não perceber.

---

### P2 — Screens fora do padrão feature-first

O padrão feature-first está implementado pela metade:

```
src/
  features/
    ipu/screens/IPUScreen.tsx        ✅ dentro da feature
    calibration/screens/CalibrationScreen.tsx  ✅ dentro da feature
  screens/
    HomeScreen.tsx                   ❌ fora do padrão
    ModelsScreen.tsx                 ❌ fora do padrão
```

Não há critério aparente para o que fica em `src/screens/` vs dentro de cada feature.

---

### P3 — Dois arquivos de tema

`constants/theme.ts` é o arquivo gerado pelo template padrão do Expo (contém `Colors.light/dark`, `Fonts`). Nenhum arquivo do projeto o importa. O tema real e em uso é `src/design-system/theme.ts`.

O arquivo fantasma confunde sobre qual é a fonte da verdade para tokens de design.

---

### P4 — Artefatos de build e arquivos pessoais commitados *(crítico)*

Os seguintes diretórios estão no repositório e não deveriam estar:

- `playwright-report/` — relatório gerado de testes E2E
- `test-results/` — screenshots e logs de falhas do Playwright
- `scratch/whatsapp_2026-04-27_0318/` — **4 imagens JPEG de WhatsApp**

Além disso, o E2E de realtime sync está falhando. O erro indica que o teste busca por `locator('text=E2E_SYNC_...')` mas o DOM renderiza elementos genéricos sem `data-testid`, o que torna o seletor frágil.

---

### P5 — `app/_layout.tsx` com responsabilidades demais

O arquivo raiz acumula:

- Registro de service worker
- Lógica de PWA install (via `usePWAInstall`)
- Banner de atualização (via `useServiceWorkerUpdate`)
- Painel de debug (`showDebug`)
- Inicialização de sincronização em background
- Carregamento de fontes e splash screen

São pelo menos 5 responsabilidades distintas num único arquivo de ~170 linhas.

---

## Roadmap

### Fase 1 — Limpeza *(zero risco, commits isolados)*

**Objetivo:** remover ruído sem tocar em lógica de negócio.

#### 1.1 — Limpar o `.gitignore`

Adicionar as entradas que faltam:

```gitignore
# Build artifacts
playwright-report/
test-results/

# Arquivos temporários / pessoais
scratch/
```

#### 1.2 — Remover arquivos do histórico atual

```bash
git rm -r --cached playwright-report/ test-results/ scratch/
git commit -m "chore: remove build artifacts and scratch files from repo"
```

#### 1.3 — Deletar `constants/theme.ts`

O arquivo não é importado por ninguém. Deletar e commitar:

```bash
git rm constants/theme.ts
git commit -m "chore: remove unused Expo default theme file"
```

**Entregável:** repositório limpo, sem arquivos desnecessários.

---

### Fase 2 — Consolidar estrutura *(impacto estrutural, fazer arquivo a arquivo)*

**Objetivo:** eliminar duplicatas e padronizar onde cada coisa vive.

#### 2.1 — Definir `src/components/` como fonte da verdade

As versões em `src/design-system/components/` para os 4 componentes duplicados devem ser removidas. O `design-system` exporta primitivos (Button, Input, Card, Text, HStack, VStack, Toggle) — `ScreenLayout`, `ResultCard`, `ErrorBoundary` e `Title` não são primitivos e não pertencem lá.

Passos:

1. Verificar que nenhum arquivo importa das versões do design-system:
   ```bash
   grep -r "design-system/components/ScreenLayout" src/
   grep -r "design-system/components/ResultCard" src/
   grep -r "design-system/components/ErrorBoundary" src/
   grep -r "design-system/components/Title" src/
   ```
2. Deletar as versões duplicadas:
   ```bash
   git rm src/design-system/components/ScreenLayout.tsx
   git rm src/design-system/components/ResultCard.tsx
   git rm src/design-system/components/ErrorBoundary.tsx
   git rm src/design-system/components/Title.tsx
   ```
3. Rodar testes unitários para confirmar que nada quebrou.
4. Commitar:
   ```bash
   git commit -m "refactor: remove duplicate components from design-system"
   ```

#### 2.2 — Mover screens soltas para dentro das features

`HomeScreen` e `ModelsScreen` devem seguir o mesmo padrão de `IPUScreen` e `CalibrationScreen`.

Destinos:

| Arquivo atual | Destino |
|---|---|
| `src/screens/HomeScreen.tsx` | `src/features/home/screens/HomeScreen.tsx` |
| `src/screens/ModelsScreen.tsx` | `src/features/models/screens/ModelsScreen.tsx` |

Passos:

1. Criar os diretórios de destino.
2. Mover os arquivos (sem alterar o conteúdo ainda).
3. Atualizar os imports nos arquivos de rota:
   - `app/index.tsx`: `import { HomeScreen } from '@/features/home/screens/HomeScreen'`
   - `app/models.tsx`: `import { ModelsScreen } from '@/features/models/screens/ModelsScreen'`
4. Deletar `src/screens/` (ficará vazio).
5. Rodar o app e verificar que as rotas funcionam.
6. Commitar:
   ```bash
   git commit -m "refactor: move HomeScreen and ModelsScreen into feature directories"
   ```

**Entregável:** estrutura consistente, todas as screens dentro de suas features.

---

### Fase 3 — Qualidade e manutenibilidade *(pode ser incremental)*

**Objetivo:** melhorar a legibilidade do ponto de entrada e a confiabilidade dos testes.

#### 3.1 — Quebrar `app/_layout.tsx`

Extrair cada responsabilidade para seu próprio lugar:

| Responsabilidade | Destino sugerido |
|---|---|
| Registro do service worker | `src/hooks/useServiceWorkerSetup.ts` |
| Painel de debug do PWA | `src/components/PWADebugPanel.tsx` |
| Banner de install do PWA | `src/components/PWAInstallBanner.tsx` (separar de `usePWAInstall`) |
| Inicialização do sync | já está em `useSyncEngine` — apenas garantir que o hook não vaze efeitos |

Após a extração, o `_layout.tsx` deve ficar com ~50 linhas, apenas orquestrando providers e o `<Stack>`.

#### 3.2 — Corrigir o E2E de realtime sync

O teste falha porque usa seletores de texto frágeis (`locator('text=E2E_SYNC_...')`). O modelo existe no DOM (aparece no snapshot do Playwright), mas o seletor não o encontra de forma confiável.

Solução recomendada — adicionar `testID` nos componentes de card:

```tsx
// ModelCard.tsx
<Pressable testID={`model-card-${model.name}`} ...>
```

E atualizar o teste:

```ts
// realtime-sync.spec.ts
await expect(pageB.getByTestId(`model-card-${modelName}`)).toBeVisible({ timeout: 15000 });
```

Isso desacopla o teste da renderização de texto e torna o seletor estável mesmo que o label mude.

---

## Estrutura alvo (após as 3 fases)

```
src/
  components/          # componentes de layout e feedback (ScreenLayout, Toast, etc.)
  core/                # lógica pura, sem UI (cálculos, storage, sync, logging)
  design-system/       # primitivos de UI (Button, Input, Card, Text, HStack, VStack)
  features/
    calibration/       # domain, hooks, screens
    history/           # domain, application, infra
    home/
      screens/
        HomeScreen.tsx ← movida da Fase 2
    ipu/               # domain, hooks, screens
    models/
      application/
      components/
      domain/
      hooks/
      infra/
      screens/
        ModelsScreen.tsx ← movida da Fase 2
  hooks/               # hooks globais (useSyncEngine, useNetworkStatus, etc.)
  i18n/
  screens/             # ← REMOVIDO na Fase 2
```

---

## Resumo de prioridades

| # | Ação | Risco | Esforço | Impacto |
|---|---|---|---|---|
| 1 | Limpar `.gitignore` e remover artefatos | Nenhum | Baixo | Médio |
| 2 | Deletar `constants/theme.ts` | Nenhum | Baixo | Baixo |
| 3 | Remover componentes duplicados do design-system | Baixo | Baixo | Alto |
| 4 | Mover HomeScreen e ModelsScreen para features | Baixo | Médio | Alto |
| 5 | Quebrar `_layout.tsx` | Médio | Médio | Médio |
| 6 | Corrigir E2E com `testID` | Baixo | Médio | Alto |
