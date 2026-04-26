# 🚀 Roadmap de Evolução: IPU Calculator

## Status Geral (Abril 2026)

✅ = Concluído | 🔄 = Em progresso | ❌ = Pendente

---

## Fase 1: Estabilização e Qualidade (Curto Prazo)

| Item | Status | Observação |
|------|--------|------------|

| Cobertura de Testes 80% | ✅ | ~99% atual |
| Snapshot Tests | ✅ | 14 snapshots implementados |
| ErrorBoundary + LogService | ✅ | Integrado |

## Fase 2: Arquitetura e DX (Developer Experience)

| Item | Status | Observação |
|------|--------|------------|
| Clean Architecture | ✅ | Hook genérico + específico |
| UI ↔ Domínio separado | ✅ | Screens chamam hooks |
| Local Persistence | ✅ | Implementado (AsyncStorage) |
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

| Alta | Testes de integração IPUScreen | ❌ |
| Média | EAS Update para hotfixes | ❌ |
| Média | Local Persistence (histórico) | ✅ |
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
- [x] Local Persistence (histórico de cálculos)
- [x] Design System aprimorado (Header, Title, Card)
- [x] Sincronização de estado assistente/lógica (Calibração)

---

## ❌ Pendente de Implementação

1. **Testes de integração no IPUScreen**
   - Não existe teste de fluxo completo
   - Necessary: testar usuário preenchendo → calculando → resultado

### Prioridade Média

2. **EAS Update para hotfixes**
   - Configurar `eas.json` com `updates`
   - Permitir推送 sem Apple/Google review



### Prioridade Baixa

3. **Acessibilidade**
   - accessibilityLabel em inputs
   - accessibilityHint para instruções
   - Contraste adequado

4. **Offline First**
   - Strategy de cache offline
   - Funcionar sem internet
   - Nota: Em web (localhost), `isInternetReachable` retorna `null` inicialmente
     - Testar em produção para validar detecção de rede

---

## 📋 Ordem de Implementação Sugerida

1. Testes de integração (validação de fluxo)
2. EAS Update (rapidez em hotfixes)
3. Acessibilidade (mercado)
4. Offline First (ambiente industrial)

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