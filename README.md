Sistema de Suporte ao Processo de Injeção (IPU)

Aplicação desenvolvida para padronizar e automatizar etapas do processo de injeção de materiais em assentos sanitários, disponível em web e mobile, com foco em precisão, consistência e eficiência operacional.

🔗 Web: https://ipu-calculator.vercel.app/
📱 Mobile: em desenvolvimento com Expo

---

📌 Sobre o projeto

Este sistema foi criado para resolver um problema real de operação: cálculos e ajustes críticos realizados manualmente durante o processo produtivo.

Essas operações impactam diretamente:

- qualidade do produto final
- consumo de matéria-prima
- estabilidade do processo

A aplicação centraliza essas etapas em uma interface acessível (web e mobile), permitindo maior controle e padronização da execução.

---

🚀 Funcionalidades

🧪 Módulo de Tempo de Injeção

Determina o tempo necessário para injeção do material em diferentes modelos.

- utiliza:
  - Isocianato
  - Poliol
- considera variação por modelo
- melhora a repetibilidade do processo

---

⚙️ Módulo de Calibragem de Vazão

Responsável por ajustar a quantidade de material injetada.

- controle de fluxo
- redução de desperdício
- consistência entre ciclos

---

🔢 Tratamento de dados

- parsing de valores
- formatação padronizada
- utilitários reutilizáveis

---

🧠 Arquitetura

O sistema segue uma abordagem modular, preparada para múltiplas plataformas.

src/
 ┣ components/
 ┣ features/
 ┃ ┣ injection-time/
 ┃ ┗ flow-calibration/
 ┣ utils/
 ┣ pages/        # Web (Next.js)
 ┣ mobile/       # Mobile (Expo)

Princípios:

- separação entre lógica e interface
- organização por domínio
- reutilização de código
- suporte a múltiplos clientes (web e mobile)

---

🛠️ Tecnologias

Web

- React
- Next.js

Mobile

- React Native
- Expo

Geral

- TypeScript
- Arquitetura modular

Deploy

- Vercel (web)

---

🎯 Objetivo técnico

Demonstrar a capacidade de:

- modelar processos industriais em software
- estruturar aplicações escaláveis
- construir soluções com impacto direto na operação

---

📈 Evolução do sistema

O projeto está em evolução contínua, com foco em expansão funcional e maturidade arquitetural.

Próximos passos:

- testes automatizados
- melhoria de experiência do usuário
- novas funcionalidades operacionais

---

⚙️ Instalação e Uso

1. Clonar e instalar

git clone https://github.com/edsondevfrontend/calculadora-ipu.git
cd calculadora-ipu
npm install

---

2. Rodar em desenvolvimento

npx expo start

---

3. Executar testes

npm test

---

📦 Builds e Distribuição

Para gerar um APK instalável via EAS Build:

eas build -p android --profile preview

---

💡 Impacto

- redução de erros operacionais
- padronização do processo
- aumento de produtividade
- acesso facilitado (desktop e mobile)

---

👨‍💻 Autor

Edson Garcia
https://github.com/ednosmab