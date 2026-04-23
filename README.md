# IPU Calculator

📚 **Overview**

IPU Calculator is a mobile and web application built with React Native and Expo, designed to standardize and automate calculations in the injection process of sanitary seats.

The project focuses on clean architecture, scalability, and maintainability, making it suitable for real-world industrial scenarios.

🚀 **Features**

- IPU calculation
- Calibration flow
- Modular architecture (feature-based)
- Design System
- Internationalization (i18n) - PT/EN
- Error handling with global ErrorBoundary
- Cross-platform (Android, iOS, Web)
- Auto-scroll to result after calculation

🧩 **Architecture**

The project follows a modular and scalable structure:

```
src/
├── core/              # Shared logic (calculations, parsers, validators)
├── features/          # Business features (ipu, calibration)
│   ├── ipu/
│   │   ├── domain/    # calculateIPU, ipuSchema
│   │   ├── hooks/     # useIPUCalculator
│   │   └── screens/   # IPUScreen
│   └── calibration/
│       ├── domain/    # calculateCalibration, calibrationSchema
│       ├── hooks/      # useCalibration
│       └── screens/    # CalibrationScreen
├── hooks/             # Custom hooks (useCalculatorLogic)
├── design-system/      # UI components and tokens
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

📈 **Future Improvements**

- Increase test coverage
- CI/CD pipeline
- Performance optimization
- Advanced accessibility
- Local persistence (history)
- Offline-first support

👨‍💻 **Author**

Edson Garcia