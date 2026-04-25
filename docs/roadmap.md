# 🚀 Roadmap de Evolução: IPU Calculator

## Status Geral (Abril 2026)

✅ = Concluído | 🔄 = Em progresso | ❌ = Pendente

---

## Fase 1: Estabilização e Qualidade (Curto Prazo)

| Item | Status | Observação |
|------|--------|------------|
| Validação Rigorosa (Zod) | 🔄 | Schema existe mas não fixa 0,1506 |
| Cobertura de Testes 80% | ✅ | ~99% atual |
| Snapshot Tests | ✅ | 14 snapshots implementados |
| ErrorBoundary + LogService | ✅ | Integrado |

## Fase 2: Arquitetura e DX (Developer Experience)

| Item | Status | Observação |
|------|--------|------------|
| Clean Architecture | ✅ | Hook genérico + específico |
| UI ↔ Domínio separado | ✅ | Screens chamam hooks |
| Local Persistence | ❌ | Não implementado |
| FlashList | ❌ | Não aplicável (sem listas) |

## Fase 3: Automação e DevOps (Médio Prazo)

| Item | Status | Observação |
|------|--------|------------|
| CI (GitHub Actions) | ✅ | lint + test |
| EAS Update (hotfixes) | ❌ | Não configurado |
| eas.json preview | ✅ | Configurado |
| Build automatico develop | 🔄 | Pending configuração |

## Fase 4: Especialização e Produto (Longo Prazo)

| Item | Status | Observação |
|------|--------|------------|
| Offline First | ❌ | Não implementado |
| i18n (PT/EN) | ✅ | Implementado |
| Acessibilidade | ❌ | Não implementado |

---

## 🛠️ Backlog Imediato

| Prioridade | Task | Status |
|------------|------|--------|
| Alta | Fixar constante 0,1506 no Zod | ❌ |
| Alta | Testes de integração IPUScreen | ❌ |
| Média | EAS Update para hotfixes | ❌ |
| Média | Local Persistence (histórico) | ❌ |
| Baixa | Acessibilidade (accessibilityLabel) | ❌ |
| Baixa | Offline First | ❌ |

---

## ✅ Itens Concluídos

- [x] Arquitetura Hook Genérico + Específico
- [x] Schema Zod (ipuSchema, calibrationSchema)
- [x] Domínio puro (calculateIPU, calculateCalibration)
- [x] ErrorBoundary + LogService
- [x] i18n PT/EN
- [x] Design System completo
- [x] CI GitHub Actions
- [x] Testes unitários (~99%)
- [x] eas.json (preview/production)
- [x] Snapshot Tests

---

## ❌ Pendente de Implementação

### Priority Alta

1. **Fixar constante 0,1506 no Zod**
   - O schema atual (`ipuSchema.ts`) não usa a constante como valor fixo
   - Necessário: adicionar validação que exige poliol = 0,1506

2. **Testes de integração no IPUScreen**
   - Não existe teste de fluxo completo
   - Necessary: testar usuário preenchendo → calculando → resultado

### Prioridade Média

3. **EAS Update para hotfixes**
   - Configurar `eas.json` com `updates`
   - Permitir推送 sem Apple/Google review

4. **Local Persistence**
   - AsyncStorage ou Expo SQLite
   - Salvar históricos de IPU e calibrações

### Prioridade Baixa

5. **Acessibilidade**
   - accessibilityLabel em inputs
   - accessibilityHint para instruções
   - Contraste adequado

6. **Offline First**
   - Strategy de cache offline
   - Funcionar sem internet

---

## 📋 Ordem de Implementação Sugerida

1. Fixar constante 0,1506 no Zod (blokada precisão)
2. Testes de integração (validação de fluxo)
3. EAS Update (rapidez em hotfixes)
4. Local Persistence (histórico de cálculos)
5. Acessibilidade (mercado)
6. Offline First (ambiente industrial)

---

## Referência: Estrutura Atual

```
src/
├── components/       # Componentes globais
├── core/           # Constantes, parsers, formatters, validators, logging
├── design-system/  # Button, Input, Card, Text, etc
├── features/
│   ├── ipu/       # domain, hooks, screens
│   └── calibration/
├── hooks/          # useCalculatorLogic
├── i18n/           # translations
└── screens/       # Telas legacy
```