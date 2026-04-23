# Guia Técnico: useCalculatorLogic

Hook genérico que orquestra todo o fluxo de cálculo do projeto.

## 🎯 Objetivo
Prover abstração reutilizável que separa orquestração (estado, parse, validação, formatação) da UI, garantindo **SRP** e **DRY**.

## 🏗️ Estrutura da Configuração

```typescript
type CalculatorConfig<T extends string> = {
  inputs: T[];                           // chaves dos campos
  calculateFn: (...args: number[]) => number;  // função pura
  validationSchema?: z.ZodObject<any>;  // schema Zod (opcional)
};
```

## 🔄 Fluxo de Dados

```
InputUI (String) → setInputValue → Estado Interno
        ↓
   Botão Calcular
        ↓
  parseNumber (string → number)
        ↓
  Validação (Zod schema)
        ↓
  calculateFn (lógica pura)
        ↓
  formatToUserView (number → string)
        ↓
  Resultado UI
```

## 📝 Exemplo: Calculadora de IPU

```typescript
// src/features/ipu/hooks/useIPUCalculator.ts
export const useIPUCalculator = () => {
  const logic = useCalculatorLogic({
    inputs: ['isocyanate', 'polyol'],
    calculateFn: (isocyanate, polyol) => calculateIPU(isocyanate, polyol),
    validationSchema: ipuSchema,
  });

  return {
    isocyanate: logic.inputs.isocyanate,
    polyol: logic.inputs.polyol,
    setIsocyanate: (val) => logic.setInputValue('isocyanate', val),
    setPolyol: (val) => logic.setInputValue('polyol', val),
    result: logic.result,
    error: logic.error,
    fieldErrors: logic.fieldErrors,
    calculate: logic.calculate,
    clear: logic.clear,
  };
};
```

## ⚠️ Boas Práticas

1. **Ordem dos Inputs:** Deve corresponder aos argumentos de `calculateFn`
2. **Função Pura:** Nunca usar UI ou efeitos colaterais dentro de `calculateFn`
3. **Validação:** Usar schema Zod para regras de negócio
4. **Mensagens:** Erros para usuário em Português, código em Inglês

## 🧩 Arquitetura em Camadas

```
Screen (UI) → Hook Específico → useCalculatorLogic → Domínio
```

---

## 📌 dependências Internas

- `src/core/parsers/numberParser.ts` - parse string → number
- `src/core/formatters/numberFormatter.ts` - format number → string
- `src/core/validators.ts` - validações utilitárias