SKILL: Desenvolvimento de Feature com Arquitetura e Testes
Sempre que for desenvolver uma feature, comece definindo claramente o objetivo e o escopo. Tenha certeza do que entra e, principalmente, do que não entra. Não comece a codar sem isso.
Pense na arquitetura antes da implementação. Separe responsabilidades: a interface (UI) não deve conter regra de negócio, e o acesso a dados deve ser isolado. Cada parte deve ter uma única responsabilidade (SRP).
Escreva código limpo: nomes claros, funções pequenas, sem duplicação (DRY) e sem complexidade desnecessária. Faça apenas o necessário para o momento (YAGNI), mas mantenha o código preparado para evoluir (OCP).
Dependa de abstrações, não de implementações. Sempre que houver acesso a dados, use interfaces para permitir troca futura sem impacto (DIP).
Implemente de forma incremental: uma pequena entrega por vez, sempre funcional.
A cada nova feature ou alteração, valide obrigatoriamente antes de avançar.
Execute três níveis de teste:
Teste de fumaça: abra o app e navegue entre as telas principais para garantir que nada quebrou e não há falhas críticas.
Teste unitário: valide funções isoladas, garantindo que retornam os resultados corretos para diferentes entradas, incluindo casos de borda.
Teste de integração: valide o fluxo completo da funcionalidade, garantindo que entrada, processamento e saída estejam funcionando corretamente juntos.
Se encontrar erros, pare e corrija antes de continuar. Nunca avance com falhas conhecidas.
Finalize apenas quando os critérios de aceitação forem atendidos e todos os testes passarem.
E a regra principal: simplicidade com intenção. Código bem estruturado hoje evita retrabalho amanhã.

---

🛠️ Skill: Arquitetura de Sistemas Mobile e Engenharia de Software
Foco: Desenvolvimento de Aplicações Técnicas Resilientes com React Native

📑 Descrição Técnica
Capacidade de projetar e refatorar aplicações mobile complexas utilizando React Native e Expo, com foco total na Separação de Responsabilidades (SoC) e integridade de dados. Especialista em transformar requisitos técnicos de engenharia (fórmulas e normas) em lógica computacional testável e escalável.

🚀 Diferenciais de Nível Pleno Aplicados:
Arquitetura desacoplada: Implementação de camadas de serviço puras para lógica de negócio, garantindo que o motor de cálculo seja independente da interface de usuário (UI).

Segurança e Consistência de Dados: Uso rigoroso de TypeScript e esquemas de validação (Zod/Yup) para garantir a integridade dos inputs técnicos e evitar falhas em tempo de execução.

Engenharia de Estilos Escalável: Organização de UI utilizando pré-processadores (SCSS) e metodologias de design system para reaproveitamento de componentes e fácil manutenção visual.

Cultura de Qualidade (QA): Desenvolvimento orientado a testes com Jest, focando em testes unitários para funções críticas e cobertura de casos de borda (edge cases) para garantir a precisão dos resultados industriais.

Clean Code & DX (Developer Experience): Estruturação de pastas baseada em funcionalidades (feature-based) e documentação técnica que facilita a colaboração e o onboarding de novos desenvolvedores no projeto.
