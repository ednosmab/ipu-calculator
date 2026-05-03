# Codebase Hygiene Protocol

Este protocolo define os padrões de limpeza, segurança e organização física do repositório para manter a manutenibilidade e a segurança do projeto.

## 🛡️ Segurança e Arquivos Sensíveis
- **Certificados e Chaves:** Nunca versionar arquivos `.pem`, `.key` ou qualquer certificado SSL/TLS na raiz ou subpastas. O ambiente de desenvolvimento deve ser agnóstico a certificados físicos (usar proxies ou variáveis de ambiente).
- **Ignorar por Padrão:** Garanta que arquivos de configuração local (`.env.local`) e pastas de cache de ferramentas estejam sempre no `.gitignore`.

## 📁 Organização de Ativos (Assets)
- **Centralização:** Todos os ativos visuais (imagens, ícones, logotipos) devem residir em `assets/images/`.
- **Proibição de Pastas Redundantes:** Evite pastas genéricas como `images/` ou `img/` na raiz.
- **Limpeza proativa:** Se uma pasta estiver vazia ou todos os seus arquivos foram movidos para o Design System, a pasta deve ser removida imediatamente.

## 📚 Integridade da Documentação
- **Nomenclatura:** Pastas de documentação devem seguir nomes técnicos precisos (ex: `docs/summary/` em vez de `sumary`).
- **Consolidação:** Resumos de sessão devem ser consolidados para evitar poluição de arquivos `-v2`, `-v3`. Mantenha apenas o estado atual e o histórico relevante.

## 🧹 Regras de Execução para Agentes
1. **Auditoria em cada Turno:** Antes de finalizar uma tarefa, verifique se foram deixados arquivos temporários ou logs de depuração.
2. **Remoção de Código Morto:** Se uma função ou componente foi substituído por uma versão do Design System, delete o antigo imediatamente.
3. **Validar Importações:** Remova importações não utilizadas para evitar avisos de lint e confusão arquitetural.
