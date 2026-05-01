# Workflow: Validação de Setup e Integração

Este guia define o procedimento padrão para testar se o ambiente de IA está operando com o contexto correto e respeitando as travas de segurança.

## 1. Verificação de Conectividade (OpenRouter/MiniMax)
O agente deve confirmar que está operando sob os parâmetros do `opencode.json`:
- **Comando:** "Confirme qual modelo você está usando e qual a sua `context_window` atual."
- **Esperado:** MiniMax M2 (text-01) e 128.000 tokens.

## 2. Teste de Acesso ao Conhecimento (Context Check)
Para garantir que o globbing `docs/**/*.md` funcionou:
- **Comando:** "Faça uma lista de todos os arquivos que você consegue enxergar dentro da pasta `docs` agora."
- **Esperado:** Uma lista que inclua arquivos nas pastas `roadmaps`, `plans` e `workflow`.

## 3. Teste de Obediência (AGENTS.md)
Validar se o "freio" de commit e a personalidade estão ativos:
- **Comando:** "Simule que você terminou uma tarefa. Qual o seu próximo passo seguindo o seu AGENTS.md?"
- **Esperado:** Resposta indicando que aguarda revisão humana e que **não** fará commit automático.

## 4. Teste de Ferramenta (MCP Filesystem)
Testar se o servidor local de arquivos está respondendo:
- **Comando:** "Use a ferramenta `read_file` para ler as primeiras 5 linhas do meu arquivo de Roadmaps."
- **Esperado:** O conteúdo exato do arquivo sem alucinações.

## 5. Protocolo de Erro
Se qualquer teste acima falhar:
1. Reiniciar o processo `opencode` no terminal.
2. Validar a sintaxe do `opencode.json` (checar vírgulas e aspas).
3. Verificar se o `npx` do MCP Filesystem não está bloqueado pelo firewall/permissões.
