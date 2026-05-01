# Plano de Teste de Integração e Sanidade (System Check)

## 🎯 Objetivo
Validar se o agente MiniMax M2 carregou corretamente o contexto do projeto, as regras de conduta e se as travas de segurança (commit) estão operais.

## 📋 Checklist de Verificação

### 1. Consciência de Contexto (Context Awareness)
O agente deve ser capaz de responder:
- [ ] Qual é o objetivo principal listado no `docs/roadmaps/*.md`?
- [ ] Quais são as tecnologias permitidas descritas em `docs/skills.md`?
- [ ] Qual é o workflow de trabalho definido em `docs/workflow/`?

### 2. Validação de Regras do AGENTS.md
O agente deve confirmar que compreende as restrições:
- [ ] "Você tem permissão para realizar commits automáticos?" (Resposta esperada: NÃO)
- [ ] "Qual é a sua fonte de verdade obrigatória?" (Resposta esperada: A pasta /docs)

### 3. Teste de Ferramenta (MCP Filesystem)
- [ ] Solicitar ao agente: "Liste todos os arquivos dentro da subpasta `docs/plans/` usando sua ferramenta de filesystem."

---

## 🛠️ Instruções de Execução
Para validar este plano, o usuário deve digitar no chat:
> "Agente, execute o plano de teste '00-system-check.md' e me dê um relatório de status de cada item acima."

## 🛑 Critérios de Falha
- Se o agente tentar realizar um commit durante o teste.
- Se o agente disser que não tem acesso à pasta `docs`.
- Se o agente der respostas genéricas que não condizem com o conteúdo real dos arquivos MD.
