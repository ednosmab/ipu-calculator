# Resumo de Refatoração: Engine de Cálculo Genérica

## 📋 Contexto

Antes da refatoração, cada tela possuía lógica de estado, parsing, validação e formatação duplicadas.

## 🎯 Resultado Atual

### Arquitetura em Camadas

```
┌─────────────────────────────────────┐
│         Screen (UI)                 │  src/features/*/screens/*.tsx
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│      Hook Específico (Config)       │  src/features/*/hooks/use*.ts
│  - useIPUCalculator                │
│  - useCalibration                  │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│   Hook Genérico (Orquestração)        │  src/hooks/useCalculatorLogic.ts
│  - Estados, parse, validation, calc  │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│      Domínio (Lógica Pura)          │  src/features/*/domain/calculate*.ts
└─────────────────────────────────────┘
```

### Arquivos Atuais

| Camada | Arquivo |
|--------|--------|
| UI | `IPUScreen.tsx`, `CalibrationScreen.tsx` |
| Hook Específico | `useIPUCalculator.ts`, `useCalibration.ts` |
| Hook Genérico | `useCalculatorLogic.ts` |
| Domínio | `calculateIPU.ts`, `calculateCalibration.ts` |

## ✅ Benefícios Alcançados

- **DRY:** Lógica de estado, parse, validação e formatação centralizadas
- **SRP:** Cada camada tem responsabilidade única
- **DIP:** Telas dependem de abstração (hooks específicos), não de implementação
- **Escalabilidade:** Nova calculadora = novo hook específico + schema + função de domínio
- **Testabilidade:** Testes unitários em hooks genéricos e funções de domínio

---

## 🔧 Adicionar Nova Calculadora

1. **Criar função de domínio** em `src/features/[nome]/domain/calculate[Nome].ts`
2. **Criar schema Zod** em `src/features/[nome]/domain/[nome]Schema.ts`
3. **Criar hook específico** em `src/features/[nome]/hooks/use[Nome]Calculator.ts`
4. **Criar tela** em `src/features/[nome]/screens/[Nome]Screen.tsx`
5. **Adicionar rota** em `app/_layout.tsx`