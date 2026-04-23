# 🛠️ Skill: Arquiteto Clean Code & International Standard

🎯 Objetivo
Garantir que a evolução do projeto IPU Calculator mantenha a excelência técnica através da Arquitetura Limpa e da padronização internacional. Esta skill atua como um filtro rigoroso: nada é codificado sem o devido isolamento de camadas.

---

## ✅ Status das Refatorações (Abril 2026)

### Concluído

- [x] Consolidar lógica de cálculo (`useCalculatorLogic` centralizado)
- [x] Arquitetura de pastas (`src/features/ipu`, `src/features/calibration`)
- [x] Separação UI ↔ lógica
- [x] Cobertura de testes
- [x] English Only (código, variáveis, funções)
- [x] Mensagens de erro localization (Português Brasil para usuário)
- [x] Tipos compartilhados (`src/core/types.ts`)
- [x] Validações centralizadas (`src/core/validators.ts`)
- [x] Dependências auditadas

---

## 🌍 Regra de Ouro: Nomenclatura

### Código Fonte (English Only)

Variáveis, funções, classes, arquivos e comentários técnicos devem ser em Inglês:

```typescript
// ✅ CORRETO
const totalValue = calculateIPU(isocyanate, polyol);
const result = useCalculatorLogic();

// ❌ ERRADO
const valorTotal = calcularIPU(isocianato, poliol);
```

### Interface com Usuário (Português Brasil)

Mensagens de erro, labels e textos exibidos ao usuário devem ser em Português:

```typescript
// ✅ CORRETO - erro exibido ao usuário
z.number({ message: 'Informe um número válido' })
z.positive({ message: 'Peso desejado deve ser maior que zero' })

// ❌ ERRADO - código técnico
message: 'Invalid number'
```

Padrões:

- camelCase para variáveis e funções (finalResult, calculateIpu)
- PascalCase para Componentes e Classes (IpuCalculator, UserRepo)
- kebab-case para nomes de arquivos (calc-service.ts)

---

## 🏗️ Arquitetura Limpa (Clean Architecture)

Baseado na separação já existente no useCalculatorLogic:

- **Entidades e Lógica Pura**: Funções matemáticas devem ser puras e isoladas de UI
- **Inversão de Dependência (DIP)**: Telas dependem do hook genérico, nunca de cálculos inline
- **Single Responsibility (SRP)**: Cada arquivo resolve apenas um problema técnico

---

## 🚦 Protocolo de Validação

Antes de sugerir código, validar:

- Código técnico em Inglês? (variáveis, funções, comentários)
- Mensagens para usuário em Português?
- Lógica separada da UI?
- YAGNI (mínimo necessário)?