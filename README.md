# 📱 IPU Calculator | Engenharia de Alta Precisão

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Zod](https://img.shields.io/badge/Zod-3068b7?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)

**IPU Calculator** é um ecossistema de ferramentas de precisão para engenharia química e operacional, desenvolvido com os mais altos padrões de arquitetura de software mobile. O foco do projeto é converter fórmulas técnicas complexas em uma interface simples, resiliente e escalável.

---

## 💎 Diferenciais de Nível Pleno/Sênior

- **Arquitetura Baseada em Features**: Organização modular que separa responsabilidades por domínio de negócio (IPU, Calibragem).
- **Validação Robusta com Zod**: Esquemas de validação técnica que garantem integridade total dos dados antes do processamento.
- **International Standard**: Código 100% escrito em inglês, seguindo padrões globais de nomenclatura e documentação técnica.
- **Assistente Inteligente**: Sistema de cálculo auxiliar para calibragem de vazão, reduzindo erros operacionais no campo.
- **Design System Premium**: Interface em Dark Mode com tokens de design centralizados para consistência visual absoluta.

---

## 🏗️ Arquitetura do Projeto

O projeto segue os princípios de **Clean Architecture** e **SOLID**:

```text
src/
 ├── core/          # Lógica pura, constantes globais e utilitários agnósticos
 ├── components/    # UI de alta fidelidade e componentes reutilizáveis
 ├── features/      # Módulos de negócio independentes (IPU, Calibration)
 │    ├── domain/   # Regras de negócio puras e schemas Zod
 │    ├── hooks/    # Orquestração de estado e efeitos da feature
 │    └── screens/  # Telas de UI e estilos específicos
 ├── hooks/         # Hooks genéricos (ex: useCalculatorLogic)
 └── styles/        # Design System (Theme, Colors, Tokens)
```

---

## 🛠️ Tecnologias e Ferramentas

- **Core**: React Native + Expo (SDK 54)
- **Roteamento**: Expo Router (File-based routing)
- **Validação**: Zod (Schema-driven validation)
- **Estilização**: StyleSheet com Design Tokens centralizados
- **Testes**: Jest e React Native Testing Library (100% de cobertura na lógica de domínio)

---

## ⚙️ Instalação e Uso

### 1. Clonar e Instalar
```bash
git clone https://github.com/edsondevfrontend/calculadora-ipu.git
cd calculadora-ipu
npm install
```

### 2. Rodar em Desenvolvimento
```bash
npx expo start
```

### 3. Executar Testes
```bash
npm test
```

---

## 📦 Builds e Distribuição

Para gerar um APK instalável via **EAS Build**:
```bash
eas build -p android --profile preview
```

---

## 🎯 Visão Técnica

Este projeto não é apenas uma calculadora; é um demonstrador de **Engenharia de Software Mobile**. Ele prova como o desacoplamento de camadas, a inversão de dependência e a tipagem forte podem criar aplicações extremamente seguras contra falhas de runtime e fáceis de evoluir para novas plataformas (Web/Desktop).

---

**Desenvolvido com foco em resiliência por Antigravity AI.**