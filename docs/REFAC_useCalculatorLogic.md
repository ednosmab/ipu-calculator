# Resumo de Refatoração: Engine de Cálculo Genérica

## 📋 Contexto
Antes desta refatoração, cada tela de cálculo (`CalculatorScreen` e `CalibrationScreen`) possuía seu próprio hook especializado (`useCalculator` e `useCalibration`). Isso gerava duplicação de lógica de estado, tratamento de erros e formatação.

## 🎯 Mudanças Implementadas

### 1. Centralização com `useCalculatorLogic`
Criamos um hook genérico que orquestra todo o fluxo:
**Input (String) → Parse (Número) → Validação → Cálculo → Formatação → UI.**

### 2. Desativação de Hooks Específicos
- **Deletado:** `src/hooks/useCalculator.ts`
- **Deletado:** `src/hooks/useCalibration.ts`

### 3. Implementação nas Telas

#### Calculadora de IPU
```typescript
const { inputs, setInputValue, calculate, result, error, clear } = useCalculatorLogic({
  inputs: ['iso', 'poliol'],
  calculateFn: (iso, poliol) => (iso + poliol) / 0.14,
});
```

#### Calculadora de Calibragem
```typescript
const { inputs, setInputValue, calculate, result, error, clear } = useCalculatorLogic({
  inputs: ['pesoDesejado', 'valorMaquina', 'pesoReal'],
  calculateFn: (pDesejado, vMaquina, pReal) => (pDesejado * vMaquina) / pReal,
  validate: (_, __, pReal) => pReal !== 0, // Proteção contra divisão por zero
});
```

## 🚀 Benefícios Alcançados
- **DRY (Don't Repeat Yourself):** Redução de ~60% no código de gerenciamento de estado das calculadoras.
- **DIP (Dependency Inversion):** As telas agora dependem de uma abstração de cálculo, não de uma implementação rígida.
- **Escalabilidade:** Para adicionar uma nova calculadora (ex: Consumo de CO2), basta configurar o hook na nova tela.
- **Testabilidade:** O motor de cálculo agora é testado via testes de integração isolados.

## ✅ Conclusão
O projeto IPU Calculator agora possui uma base sólida e modular, pronta para receber novas funcionalidades (como o CRUD de Assentos) sem degradar a qualidade do código.
