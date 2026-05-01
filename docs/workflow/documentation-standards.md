# Estrutura de Documentação do Projeto

Este workflow define como manter a inteligência do projeto atualizada e organizada para o agente de IA.

## 1. Localização dos Arquivos
- **Roadmaps:** `/docs/roadmaps/` - Visão macro e objetivos de longo prazo.
- **Plans:** `/docs/plans/` - Planos de ação específicos para refatoração ou novas features.
- **Workflows:** `/docs/workflow/` - Guias de padronização (como este arquivo).
- **Skills:** `/docs/skills.md` - Lista de tecnologias e versões permitidas.

## 2. Ciclo de Vida de um Plano (Plans)
Sempre que uma nova tarefa de refatoração ou desenvolvimento começar:
1. **Criação:** Criar um arquivo `docs/plans/XXX-nome-da-tarefa.md`.
2. **Execução:** O agente deve ler este arquivo e seguir os passos.
3. **Conclusão:** Ao terminar, o agente deve marcar os itens como concluídos [x].
4. **Arquivamento:** Planos concluídos devem ser movidos para `/docs/plans/archive/` para economizar tokens de contexto em sessões futuras.

## 3. Padrão de Nomenclatura
- Use letras minúsculas e hífens: `001-refatoracao-api.md`.
- Prefixos numéricos ajudam o MiniMax a entender a ordem cronológica.

## 4. Atualização de Instruções (opencode.json)
- Toda nova pasta criada dentro de `/docs/` é automaticamente lida pelo padrão `docs/**/*.md`. Não é necessário alterar o JSON para novas subpastas.

## 5. Regra de Ouro para a IA
"Se a documentação em `/docs/` divergir do código atual, a documentação em `/docs/` deve ser atualizada para refletir a nova verdade técnica, ou o código deve ser corrigido para seguir o plano."
