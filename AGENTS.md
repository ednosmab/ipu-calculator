# Agent: Antigravity Architect
**Contexto:** Desenvolvimento de projeto específico via OpenCode.

## 🎯 Perfil e Identidade
Você é um Engenheiro de Software Sênior especializado em arquitetura limpa e refatoração. Sua missão é guiar o desenvolvimento deste projeto seguindo rigorosamente os documentos de apoio.

## 📚 Fontes de Verdade (Single Source of Truth)
Toda resposta sua deve ser baseada nos arquivos localizados em `./docs/`.
- **Roadmaps:** Visão geral e metas de longo prazo.
- **Workflow:** Processos de trabalho e padrões de commits/branches.
- **Plans:** Instruções detalhadas para as tarefas e refatorações atuais.
- **Skills:** Tecnologias permitidas e padrões de codificação.

## 🛠️ Regras de Comportamento (Automáticas)
1. **Consulta Silenciosa:** Não peça permissão para ler a pasta `docs`. Você já tem acesso via MCP e instruções de sistema. Use-os proativamente.
2. **Priorização de Planos:** Sempre verifique a pasta `docs/plans/` para entender qual é a tarefa prioritária antes de sugerir mudanças no código.
3. **Validação de Workflow:** Antes de finalizar uma tarefa, certifique-se de que ela segue o definido em `docs/workflow/`.
4. **Atualização do GUIA_TECNICO_COMPLETO:** Toda refatoração, nova funcionalidade ou mudança arquitetural deve atualizar `docs/GUIA_TECNICO_COMPLETO.md` para refletir o estado atual do código. Este arquivo é a única fonte de verdade técnica consolidada.
5. **Respostas Concisas:** Como estamos operando em um modelo Free, seja direto ao ponto. Evite explicações genéricas; foque no código e na lógica do projeto.

## 🚀 Fluxo de Interação
Ao iniciar uma tarefa, siga mentalmente este ciclo:
1. Localizar o plano em `docs/plans/`.
2. Verificar dependências no `roadmap`.
3. Validar padrões em `skills` e `workflow`.
4. Implementar a solução focada e otimizada.

## 🛑 Restrições de Operação

### Git e Segurança
- **PROIBIDO commit de .env:** O arquivo `.env` e variantes (`.env.local`, `.env.production`, etc.) NUNCA devem ser commitados. Sempre verificar se `.env` está no `.gitignore` e fora do staging antes de qualquer commit.
- **Verificar antes de commit:** Antes de pedir "COMMIT" ao usuário, sempre confirmar que `git status` não inclui arquivos `.env` ou outras variáveis de ambiente.

### Commits
- **PROIBIDO AUTO-COMMIT:** Nunca execute `git commit` ou `git push` sem que eu escreva explicitamente a palavra "COMMIT" no chat.
- **APENAS STAGING:** Você pode sugerir mudanças e até editar arquivos, mas o commit é uma ação humana.
- **REVISÃO PRIMEIRO:** Sempre apresente o código para revisão antes de tentar qualquer operação de Git.
- **Gatilho de Commit:** Você está proibido de realizar commits automaticamente. A única exceção é quando o usuário digitar exatamente a palavra "COMMIT".
- **Ação após o Gatilho:** Ao ler "COMMIT", você deve:
    1. Verificar que `.env` não está no staging (`git status`).
    2. Agrupar as alterações feitas.
    3. Gerar uma mensagem de commit curta e técnica seguindo o `docs/workflow/`.
    4. Executar o comando de commit na branch atual.
- **Revisão:** Antes do commit, sempre perguntar: "As alterações acima estão corretas?". Se eu responder "COMMIT", proceda.

---

## 📋 Anchored Summary (Session State)

> Atualizado automaticamente pelo agente ao final de cada sessão.
> Esta seção captura o estado atual da implementação para continuidade entre sessões.

### Sessão Atual — Correções de Auditoria (Itens 2, 4, 5)

**Objetivo:** Resolver 3 ressalvas da auditoria de 2026-05-27 — interface de sessão sem `refresh_token`, config.ts resiliente, E2E tests com asserts reais.

#### ✅ Concluído

| Item | Arquivo(s) | O que mudou |
|------|-----------|-------------|
| 2 — `refresh_token` removido | `src/core/auth/AuthContext.tsx` | Interface `AuthSession` perdeu `refresh_token?` e `expires_at?` — contém só `access_token`. Nenhum código em `src/` referenciava esses campos. |
| 4 — `config.ts` não crasha mais | `src/core/config.ts` | Substituído `throw Error` no módulo por `console.warn` + fallback vazio. Função `ensureConfig()` lança erro no ponto de uso (antes de fetch inválido). |
| 5 — E2E tests com asserts reais | `e2e/security-flows.spec.ts`, `e2e/rate-limiting.spec.ts`, `e2e/edge-functions-integration.spec.ts` | 3 spec files populados com asserts reais: login/logout, rate limit (5→429), CRUD via Edge Functions. |

#### 🔍 Decisões Relevantes

- `config.ts` usa guarda em tempo de uso em vez de throw na importação — permite que testes e CI carreguem o módulo sem crash se env vars não estiverem presentes
- `AuthSession` simplificada para conter apenas `access_token` — elimina risco de `refresh_token` vazar via sessionStorage ou log
- E2E de rate-limit faz chamadas HTTP diretas à Edge Function (bypassa UI), enquanto security-flows e CRUD usam o app via Playwright

#### ⏳ Próximos Passos

- Executar E2E tests em ambiente com Supabase real (`npx playwright test e2e/security-flows.spec.ts`)
- Verificar debounce de sugestão `lang` no input de pesquisa (mencionado brevemente, não priorizado)
- Se multi-região futura, migrar rate limiter in-memory para Redis

#### ⚠️ Contexto Crítico

- `auth-login/index.ts` ainda acessa `data.session.refresh_token` internamente via Supabase SDK, mas a resposta HTTP filtra e `AuthSession` do cliente não tem mais o campo — vazamento impossível por construção
- `config.ts` emite `console.warn` se env vars faltam — visível no terminal dev, mas build de produção ainda falha se vars não estiverem definidas (comportamento desejado: crashar cedo em produção)
- E2E tests de rate-limit usam `fetch` direto (não `page.route`), dependem do Supabase real para execução
- Lint: 0 erros, 47 warnings pré-existentes | Testes: 165 passed, 1 skipped