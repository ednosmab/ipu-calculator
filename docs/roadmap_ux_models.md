# 🚀 Roadmap: UX & Model Improvements

## Status Geral

✅ = Concluído | 🔄 = Em progresso | ❌ = Pendente

---

## Fase 1: Indicadores de Modelo

| Item | Status | Descrição |
|------|--------|----------|
| Indicador de Criado | ✅ | Badge "Novo" azul (#4A90D9) |
| Indicador de Editado | ✅ | Badge "Editado" laranja (#FF9500) |
| Status de Sync | ✅ | Ícone nuvem (synced/pending) |

---

## Fase 2: Feedback de Erro

| Item | Status | Descrição |
|------|--------|----------|
| Modelo Duplicado | ❌ | Exibir erro específico quando nome já existe |
| Toast/Alert | ❌ | Mensagem clara para o usuário |

---

## Fase 3: Loading & Transições

| Item | Status | Descrição |
|------|--------|----------|
| Skeleton Loading | ❌ | Animação de loading para modelos |
| Transições | ❌ | Animações suaves entre telas/elementos |
| Pull to Refresh | ❌ | Atualizar models com gesto |

---

## Fase 4: Busca de Modelos

| Item | Status | Descrição |
|------|--------|----------|
| Search Medio | ❌ | Buscar mesmo em qualquer parte do nome |
| Case Insensitive | ❌ | Ignorar maiúsculas/minúsculas |
| Highlight | ❌ | Destacar termos encontrados |

---

## 🛠️ Backlog Imediato

| Prioridade | Task | Status | Descrição |
|------------|------|--------|----------|
| Alta | Indicador Editado | ✅ | Badge laranja nos cards |
| Alta | Indicador Criado | ✅ | Badge azul nos cards |
| Alta | Modelo Duplicado | ❌ | Exibir erro claro ao criar |
| Média | Loading Animation | ❌ | Skeleton ou Spinner na lista |
| Média | Transições | ❌ | Animações em elementos |
| Baixa | Search Melhorado | ❌ | Buscar em qualquer posição |

---

## ✅ Itens Concluídos

- [x] Badge "Novo" para modelos criados localmente (azul #4A90D9)
- [x] Badge "Editado" para modelos editados localmente (laranja #FF9500)
- [x] Campo `localAction` no CalculationModel
- [x] Atualização automática via modelRepository

## 📋 Detalhamento

### Indicador Criado/Editado

- ✅ Badge "Novo" (azul #4A90D9) para modelos criados localmente
- ✅ Badge "Editado" (laranja #FF9500) para modelos editados
- Campo `localAction` no modelo: 'created' | 'edited' | null
- Exibição condicional no ModelsScreen.tsx

### Modelo Duplicado

- Validação em tempo real no form
- Mensagem: "Já existe um modelo com este nome"
- Suggest alternativas

### Loading Animation

- Skeleton loader para lista de modelos
- Spinner para ações de sync

### Search

- Regex: `/search/i.test(model.name)`
- Buscar em qualquer parte do nome

---

## Referência: Estrutura Atual

```
src/features/models/
├── hooks/useRealtimeModels.ts    # Lista de modelos
├── screens/ModelsScreen.tsx     # Tela de modelos
└── infra/modelRepository.ts     # Repository
```

---

*Roadmap gerado em 29/04/2026.*