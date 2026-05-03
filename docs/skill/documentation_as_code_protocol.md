# Documentation as Code Protocol

Este protocolo define como a documentação de alto nível (README) deve ser mantida e sincronizada com a evolução técnica do projeto.

## 🎯 Filosofia: README como Produto
O README não é apenas um guia de instalação, é a vitrine técnica da aplicação. Ele deve refletir a maturidade do código e a clareza das decisões de negócio.

## 🏗️ Estrutura Hierárquica
O README deve sempre priorizar o **Core de Negócio** antes da infraestrutura:
1. **Identidade:** Nome, propósito e proposta de valor.
2. **Core Features (O Coração):** Detalhamento dos motores de cálculo (IPU e Calibração).
3. **Pilares Técnicos:** Clean Architecture, Offline-First, PWA, Design System.
4. **Guia de Execução:** Como rodar, testar e buildar.

## 🔄 Ciclo de Atualização
- **Sincronização:** Sempre que uma nova `Skill` for adicionada ao diretório `docs/skill/`, a seção de "Pilares Técnicos" do README deve ser revisada.
- **Versionamento:** O README deve refletir a versão atual definida no `package.json`.
- **Diagramas:** Use Mermaid.js para visualizar fluxos complexos, especialmente para a orquestração de sincronização e fluxos de cálculo.

## 🤖 Papel do Agente
O Agente (Antigravity) é o curador do README. Durante cada ciclo de refatoração, ele deve avaliar se o README ainda representa fielmente o "Estado da Arte" do projeto.
