# IPU Calculator

[![CI](https://github.com/ednosmab/ipu-calculator/actions/workflows/ci.yml/badge.svg)](https://github.com/ednosmab/ipu-calculator/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-98.94%25-brightgreen)](https://github.com/ednosmab/ipu-calculator)

📚 **Overview**

IPU Calculator is a mobile and web application built with React Native and Expo, designed to standardize and automate calculations in the injection process of sanitary seats.

The project focuses on clean architecture, scalability, and maintainability, making it suitable for real-world industrial scenarios.

🚀 **Features**

- IPU calculation
- Calibration flow
- Modular architecture (feature-based)
- Design System
- Internationalization (i18n) - PT/EN
- Error handling with global ErrorBoundary + LogService
- Auto-scroll to result after calculation
- Cross-platform (Android, iOS, Web)

🧩 **Architecture**

The project follows a modular and scalable structure:

```
src/
├── core/              # Shared logic (calculations, parsers, validators, logging)
├── features/          # Business features (ipu, calibration)
│   ├── ipu/
│   │   ├── domain/    # calculateIPU, ipuSchema
│   │   ├── hooks/     # useIPUCalculator
│   │   └── screens/   # IPUScreen
│   └── calibration/
│       ├── domain/    # calculateCalibration, calibrationSchema
│       ├── hooks/     # useCalibration
│       └── screens/   # CalibrationScreen
├── hooks/             # Custom hooks (useCalculatorLogic)
├── design-system/     # UI components and tokens
└── i18n/              # Translations (PT/EN)
```

**Principles**
- Separation of concerns (UI ↔ Business Logic)
- Domain-driven structure
- Reusable Design System components
- Typed with TypeScript + Zod

📖 **Testing**

The project uses Jest with two strategies:

- Unit tests → business logic
- Integration tests → components and hooks

| Metric | Status |
|--------|--------|
| Coverage | **98.94%** |
| Tests | **31 passing** |
| Lint | **0 errors** |

Run tests:

```bash
npm test
```

🛠️ **Tech Stack**

- React Native
- Expo
- TypeScript
- Expo Router
- Jest
- Zod
- React Context (i18n)

📦 **Installation**

```bash
npm install
```

🚀 **Running the project**

```bash
npm run start
```

**Platforms**
- Android: `npm run android`
- iOS: `npm run ios`
- Web: `npm run web`

🏗️ **Build**

```bash
npm run build
```

🛡️ **Quality Assurance**

- CI/CD with GitHub Actions
- ESLint for code quality
- Jest for automated testing
- ErrorBoundary + LogService for error monitoring

📈 **Future Improvements**

- Advanced accessibility (a11y)
- Local persistence (history)
- Snapshot tests for Design System
- Offline-first support

👨‍💻 **Author**

Edson Garcia - [GitHub](https://github.com/ednosmab)