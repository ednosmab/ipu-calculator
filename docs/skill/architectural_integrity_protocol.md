# SKILL: Architectural Integrity & Dependency Guard

Este protocolo define as fronteiras entre as camadas da Clean Architecture (Domain, Application, Infra, UI) e estabelece regras rígidas para evitar Dependências Circulares.

---

## 🏗️ A Hierarquia de Camadas (Unidirecional)

As dependências devem sempre apontar para dentro (em direção ao Domínio) ou para baixo (em direção à Infraestrutura através de interfaces).

1.  **UI (app/, components/)** -> Importa UseCases e Hooks.
2.  **Hooks (hooks/)** -> Importa UseCases e Repositórios.
3.  **Application (UseCases)** -> Importa Repositórios e Domínio.
4.  **Infra (Repository, Services)** -> Importa Domínio e Drivers Externos.
5.  **Domain (Entities, Types)** -> NÃO importa nada (Puro).

---

## 🚫 Regra de Ouro contra Dependências Circulares

**Repositórios NUNCA devem importar UseCases.**

- **O Problema**: Se o `modelRepository` importa um `syncUseCase` e esse `syncUseCase` usa o `modelRepository`, temos um ciclo que quebra o carregamento no JavaScript (especialmente no Web/PWA).
- **A Solução (Inversão de Controle)**: Se a Infraestrutura precisa de uma lógica de aplicação, essa lógica deve ser passada via parâmetros ou o UseCase deve ser quem coordena a chamada, nunca o Repositório chamando o UseCase internamente.

---

## 🧱 Modularidade (Path Aliases)

Use sempre os aliases definidos para garantir que as importações sigam a estrutura:
- `@/core/*`: Utilidades compartilhadas.
- `@/features/*`: Lógica de negócio isolada por feature.
- `@/design-system/*`: Componentes visuais atômicos.

---

## 📋 Checklist de Nova Feature
1. O domínio foi definido primeiro?
2. O repositório lida apenas com persistência/infra?
3. O UseCase coordena a lógica de negócio?
4. Existe algum import de camada superior em camada inferior? (Se sim, pare e refatore).

---

## ⚠️ Sinais de Alerta (Bad Smells)
- Erros de `Undefined` ao importar uma constante ou classe (sinal clássico de ciclo).
- Arquivos de `index.ts` que exportam tudo de uma pasta (facilitam ciclos indevidos).
- Hooks que contém lógica de negócio complexa (deveria estar no UseCase).
