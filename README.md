# IPU Calculator

Sistema de suporte ao processo de injeção de materiais em assentos sanitários.

🔗 **Web:** https://ipu-calculator.vercel.app/
📱 **Mobile:** Expo (em desenvolvimento)

---

## 🚀 Funcionalidades

### Calcular Injeção (IPU)

Calcula o índice de unidades de politano (IPU) baseado na soma de isocyanate + polyol.

- Formula: `IPU = (isocyanate + polyol) / 0.14`
- Validação: valores positivos

### Calibrar Vazão

Ajusta o fluxo de material usando a Regra de Three.

- Formula: `correctedValue = (targetWeight * machineValue) / actualWeight`
- Proteção contra divisão por zero
- Helper: cálculo automático de actualWeight

---

## 🏗️ Arquitetura

```
src/
├── core/                      # Módulos compartilhados
│   ├── calculations/         # Funções matemáticas genéricas
│   ├── constants/          # Constantes (IPU_CONSTANTS)
│   ├── formatters/        # numberFormatter (pt-BR)
│   ├── parsers/           # numberParser
│   ├── types.ts          # Tipos compartilhados
│   └── validators.ts     # Validações utilitárias
│
├── design-system/            # Design System
│   ├── components/       # Button, Input, Card, Text, etc.
│   └── theme.ts          # Tokens: colors, spacing, typography
│
├── features/              # Funcionalidades por domínio
│   ├── ipu/
│   │   ├── domain/       # calculateIPU, ipuSchema
│   │   ├── hooks/       # useIPUCalculator
│   │   └── screens/     # IPUScreen
│   │
│   └── calibration/
│       ├── domain/       # calculateCalibration, calibrationSchema
│       ├── hooks/       # useCalibration
│       └── screens/     # CalibrationScreen
│
└── hooks/
    └── useCalculatorLogic.ts  # Hook genérico de cálculo
```

### Padrão: Hook Genérico + Hook Específico

1. **Domínio** - Função pura de cálculo (`domain/calculate*.ts`)
2. **Schema** - Validação Zod (`domain/*Schema.ts`)
3. **Hook Específico** - Configura useCalculatorLogic (`hooks/use*Calculator.ts`)
4. **Screen** - UI que consome hook específico

Fluxo: `Screen → Hook Específico → useCalculatorLogic → Domínio`

---

## 🛠️ Tech Stack

- **Framework:** Expo + React Native
- **Linguagem:** TypeScript
- **Validação:** Zod
- **Testes:** Jest
- **Deploy Web:** Vercel

---

## ⚙️ Instalação e Uso

```bash
# Clonar
git clone https://github.com/ednosmab/calculadora-ipu.git
cd calculadora-ipu

# Instalar dependências
npm install

# Rodar desenvolvimento
npx expo start

# Executar testes
npm test

# Verificar lint
npm run lint

# Build web
npm run build
```

---

## 🧪 Testes

```
Test Suites: 5 passed
Tests:       25 passing
Cobertura:   funções de domínio, parsers, formatters
```

---

## 📋 Regras de Nomenclatura

- **Código técnico:** English Only (`calculateIPU`, `totalValue`)
- **Mensagens ao usuário:** Português Brasil (`"Informe um número válido"`)

---

## 👨‍💻 Autor

Edson Garcia - https://github.com/ednosmab