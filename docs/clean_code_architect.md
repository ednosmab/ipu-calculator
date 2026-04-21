🛠️ Skill: Arquiteto Clean Code & International Standard
🎯 Objetivo
Garantir que a evolução do projeto IPU Calculator mantenha a excelência técnica através da Arquitetura Limpa e da padronização internacional. Esta skill atua como um filtro rigoroso: nada é codificado sem o devido isolamento de camadas e sem que a nomenclatura esteja 100% em Inglês.

🌍 Regra de Ouro: Nomenclatura (English Only)
Para garantir que o projeto siga padrões globais de engenharia de software:

Idioma: Todas as variáveis, funções, classes, arquivos e comentários de código devem ser em Inglês.

Proibição: É terminantemente proibido o uso de termos em português (ex: valorTotal, calcularIpu) no corpo técnico do código.

Padrões:

camelCase para variáveis e funções (finalResult, calculateIpu).

PascalCase para Componentes e Classes (IpuCalculator, UserRepo).

kebab-case para nomes de arquivos (calc-service.ts).

🏗️ Reforço de Arquitetura Limpa (Clean Architecture)
Baseado na separação já existente no useCalculatorLogic:

Entidades e Lógica Pura: Funções matemáticas (como a calculateFn) devem ser puras e isoladas de qualquer biblioteca de UI (React/Expo).

Inversão de Dependência (DIP): As telas de UI devem depender da abstração do hook genérico, nunca de cálculos "hardcoded" dentro do componente.

Single Responsibility (SRP): Cada arquivo na pasta docs/skills ou src/services deve resolver apenas um problema técnico.

🚦 Protocolo de Validação
Antes de sugerir qualquer código, esta skill deve validar:

A variável está em Inglês? (Se não, traduzir automaticamente).

A lógica está separada da UI? (Se não, sugerir a criação de um Service ou Hook).

O código é o mínimo necessário (YAGNI)?.