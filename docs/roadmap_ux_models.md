# 🚀 Roadmap: UX & Model Improvements

## Status Geral

✅ = Concluído | 🔄 = Em progresso | ❌ = Pendente

---

## Fase 1: Indicadores de Modelo

| Item | Status | Descrição |
|------|--------|----------|
| Indicador de Edit | ❌ | Badge/ícone indicando modelo editado |
| Indicador de Delete | ❌ | Badge/ícone indicando modelo deletado |
| Status de Sync | ❌ | Indicador visual de synced/pending |

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

| Prioridade | Task | Descrição |
|------------|------|----------|
| Alta | Indicador Edit/Delete | Badge visual nos cards de modelo |
| Alta | Modelo Duplicado | Exibir erro claro ao criar |
| Média | Loading Animation | Skeleton ou Spinner na lista |
| Média | Transições | Animações em elementos |
| Baixa | Search Melhorado | Buscar em qualquer posição |

---

## 📋 Detalhamento

### Indicador Edit/Delete

- Adicionar badge nos cards do modelo
- Edit: ícone de "editado" com timestamp
- Delete: toast "Modelo deletado" com Undo

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