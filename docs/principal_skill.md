# SKILL: Desenvolvimento de Feature com Arquitetura e Testes

Sempre que for desenvolver uma feature, comece definindo claramente o objetivo e o escopo. Tenha certeza do que entra e, principalmente, do que não entra. Não comece a codar sem isso.

Pense na arquitetura antes da implementação. Separe responsabilidades: a interface (UI) não deve conter regra de negócio, e o acesso a dados deve ser isolado. Cada parte deve ter uma única responsabilidade (SRP).

Escreva código limpo: nomes claros, funções pequenas, sem duplicação (DRY) e sem complexidade desnecessária. Faça apenas o necessário para o momento (YAGNI), mas mantenha o código preparado para evoluir (OCP).

Dependa de abstrações, não de implementações. Sempre que houver acesso a dados, use interfaces para permitir troca futura sem impacto (DIP).

Implemente de forma incremental: uma pequena entrega por vez, sempre funcional.

A cada nova feature ou alteração, valide obrigatoriamente antes de avançar.

Execute três níveis de teste:
- Teste de fumaça: abra o app e navegue entre as telas principais
- Teste unitário: valide funções isoladas, incluindo casos de borda
- Teste de integração: valide o fluxo completo da funcionalidade

Se encontrar erros, pare e corrija antes de continuar. Nunca avance com falhas conhecidas.

Finalize apenas quando os critérios de aceitação forem atendidos e todos os testes passarem.

---

## 🏗️ Arquitetura do Projeto

### Padrão: Hook Genérico + Hook Específico

Para calculadoras, usar `useCalculatorLogic` como base:

1. **Domínio** - Função pura de cálculo (`domain/calculate*.ts`)
2. **Schema** - Validação Zod (`domain/*Schema.ts`)
3. **Hook Específico** - Configura useCalculatorLogic (`hooks/use*Calculator.ts`)
4. **Tela** - Consome hook específico (`screens/*.tsx`)

Ver `docs/useCalculatorLogic.md` para detalhes.

---

## 🛠️ Skill: Arquitetura de Sistemas Mobile

Foco: Desenvolvimento de Aplicações Técnicas Resilientes com React Native

### Diferenciais:
- **Arquitetura desacoplada**: Lógica de negócio isolada da UI
- **Segurança de dados**: TypeScript + Zod para validação
- **Design System**: Componentes reutilizáveis com theme
- **Testes**: Jest comcoverage de casos de borda
- **DX**: Estrutura feature-based + documentação