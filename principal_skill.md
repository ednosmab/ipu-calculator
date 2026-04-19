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
