# Plano de Implementação — Correções de Segurança
**Projeto:** ipu-calculator  
**Para:** Agente de IA  
**Escopo:** 5 vulnerabilidades priorizadas  
**Entrega:** Arquivos prontos para substituir

---

## Como executar este plano

Este plano é sequencial. Cada fase produz arquivos prontos para substituir os originais no repositório.
O agente não deve gerar instruções nem diffs — deve gerar os arquivos completos corrigidos.
Ao final de cada fase, o agente deve listar os arquivos gerados e seus caminhos relativos.

---

## Fase 1 — Remover debug functions de produção (CRÍTICO)

**Contexto:** As funções `debug-env`, `debug-insert`, `debug-profile`, `fix-profile` e `check-users` estão deployadas sem autenticação. Qualquer pessoa pode promover usuários a admin, listar todos os usuários e inspecionar variáveis de ambiente.

**O que o agente deve fazer:**

Reescrever cada uma das cinco funções abaixo para retornar HTTP 404 `NOT_FOUND` imediatamente, sem executar nenhuma lógica. O endpoint deve continuar existindo para não quebrar deploys, mas deve ser inerte.

Gerar os seguintes arquivos completos:

1. `supabase/functions/debug-env/index.ts`
2. `supabase/functions/debug-insert/index.ts`
3. `supabase/functions/debug-profile/index.ts`
4. `supabase/functions/fix-profile/index.ts`
5. `supabase/functions/check-users/index.ts`

**Contrato de cada arquivo gerado:**
- Importar `handleCors` de `../_shared/cors.ts` e `err` de `../_shared/response.ts`
- Responder OPTIONS normalmente (para não quebrar preflight)
- Para qualquer outro método, retornar `err('NOT_FOUND', 404)`
- Incluir comentário no topo: `// DESATIVADO — endpoint de debug removido de produção`
- Não importar nem usar `createClient`, `requireAuth` ou qualquer lógica de negócio

**Exemplo de estrutura esperada:**
```ts
// DESATIVADO — endpoint de debug removido de produção
import { handleCors } from '../_shared/cors.ts';
import { err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  return err('NOT_FOUND', 404);
});
```

---

## Fase 2 — Eliminar logs sensíveis do AuthProvider

**Contexto:** O `AuthProvider` loga o e-mail do usuário e o status da resposta de login via `console.log`, visíveis em ferramentas de debug, crash reports e sessões gravadas.

**O que o agente deve fazer:**

Gerar o arquivo completo `src/core/auth/AuthProvider.tsx` com as seguintes alterações cirúrgicas — sem mudar nenhuma outra linha:

1. **Linha 145** — remover completamente:
   ```ts
   // REMOVER:
   console.log(`[AuthProvider] signIn — email: ${email}`);
   ```

2. **Linha 157** — remover completamente:
   ```ts
   // REMOVER:
   console.log(`[AuthProvider] signIn response — status: ${res.status}`);
   ```

3. **Linha 161** — substituir por versão sem dado sensível:
   ```ts
   // ANTES:
   console.error(`[AuthProvider] signIn error: ${errorCode}`);
   // DEPOIS:
   console.error('[AuthProvider] signIn error: INVALID_CREDENTIALS');
   ```

4. **Linha 114** — remover completamente:
   ```ts
   // REMOVER:
   console.log('[Auth] Tentando fallback via auth-validate...');
   ```

Todos os `console.warn` que não contêm dados de usuário devem ser **mantidos** — são úteis para debug de problemas de rede e sessão.

**Arquivo a gerar:** `src/core/auth/AuthProvider.tsx` (completo)

---

## Fase 3 — Unificar o fluxo de autenticação

**Contexto:** O `AuthProvider.signIn` autentica diretamente em `/auth/v1/token`, ignorando a Edge Function `auth-login` que possui audit log e criação automática de perfil. Isso gera dead code no backend e audit log vazio para logins.

**O que o agente deve fazer:**

Gerar `src/core/auth/AuthProvider.tsx` (baseado na versão já corrigida na Fase 2) com a função `signIn` reescrita para chamar a Edge Function `auth-login` em vez do endpoint direto do Supabase.

**Novo contrato do `signIn`:**

```
POST {CONFIG.EDGE_FUNCTIONS_URL}/auth-login
Headers: Content-Type: application/json, apikey: CONFIG.SUPABASE_ANON_KEY
Body: { email, password }

Resposta esperada (sucesso 200):
{
  session: { access_token: string, ... },
  profile: { id, name, role, active }
}

Resposta de erro:
{
  error: 'INVALID_CREDENTIALS' | 'ACCOUNT_SUSPENDED' | 'INTERNAL_ERROR'
}
```

A nova implementação do `signIn` deve:
- Fazer fetch para `${CONFIG.EDGE_FUNCTIONS_URL}/auth-login` com método POST
- Em caso de erro HTTP, ler o campo `error` da resposta JSON e lançar `new Error(data.error)`
- Em caso de sucesso, usar `data.session.access_token` e `data.profile` diretamente (sem chamar `fetchProfile` novamente, pois o profile já vem da edge function)
- Salvar token e profile em `sessionStorage` como hoje
- Atualizar os states `session`, `user` e `profile` como hoje

A função `fetchProfile` deve ser **mantida** — ela ainda é usada na restauração de sessão ao montar o componente.

**Arquivo a gerar:** `src/core/auth/AuthProvider.tsx` (completo, incorporando Fase 2)

---

## Fase 4 — Implementar rate limiting no auth-login

**Contexto:** O endpoint `/auth-login` não possui proteção contra brute force. Sem rate limiting, um atacante pode tentar senhas indefinidamente.

**O que o agente deve fazer:**

Gerar o arquivo `supabase/functions/auth-login/index.ts` com rate limiting implementado **sem dependência externa** (sem Redis, sem Upstash) usando o padrão in-memory com `Map` no escopo do módulo Deno.

**Especificação do rate limiter:**
- Limite: 5 tentativas por e-mail por janela de 60 segundos
- Ao atingir o limite: retornar `err('RATE_LIMITED', 429, origin)`
- Após a janela expirar: resetar o contador automaticamente
- A limpeza de entradas expiradas deve ocorrer a cada chamada (lazy cleanup) para não acumular memória

**Estrutura esperada do rate limiter:**
```ts
interface RateLimitEntry {
  count: number;
  windowStart: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(email: string): boolean {
  // implementar aqui
}
```

O rate limiter deve ser aplicado **antes** da chamada ao Supabase Auth, logo após a validação do payload `{ email, password }`.

**Observação importante:** Rate limiting in-memory é eficaz em produção com Supabase Edge Functions porque cada função roda em um único isolate persistente por região. Para multi-região, a solução correta seria Redis — mas isso pode ser uma evolução futura documentada em comentário no arquivo.

**Arquivo a gerar:** `supabase/functions/auth-login/index.ts` (completo)

---

## Fase 5 — Restringir CORS ao padrão do projeto

**Contexto:** O CORS atual aceita qualquer subdomínio `.vercel.app`, o que permite que projetos de terceiros na Vercel façam chamadas autenticadas às Edge Functions.

**O que o agente deve fazer:**

Gerar `supabase/functions/_shared/cors.ts` com a lógica de `.vercel.app` substituída por uma allowlist baseada no prefixo do projeto.

**Nova regra para origens Vercel:**
- Em vez de `origin.endsWith('.vercel.app')`, verificar se a origem corresponde ao padrão do projeto
- O padrão permitido deve ser: `origin` que termina com `.vercel.app` **E** começa com `ipu-calculator`
- Exemplo de regex: `/^https:\/\/ipu-calculator(-[a-z0-9-]+)?\.vercel\.app$/`
- O prefixo `ipu-calculator` deve vir de uma variável de ambiente `VERCEL_PROJECT_PREFIX` com fallback para `'ipu-calculator'`

**Contrato das funções:**
- `handleCors(req)` — comportamento idêntico ao atual, apenas com a regra Vercel substituída
- `getCorsHeaders(origin?)` — idem
- Origens `localhost` e `127.0.0.1` continuam permitidas sem restrição (desenvolvimento local)
- Origens em `validOrigins` (prod + staging) continuam permitidas explicitamente

**Arquivo a gerar:** `supabase/functions/_shared/cors.ts` (completo)

---

## Checklist de validação pós-implementação

O agente deve, ao final de todas as fases, gerar um arquivo `docs/security-fixes-checklist.md` com os seguintes testes manuais que o desenvolvedor deve executar:

```markdown
## Fase 1 — Debug functions
- [ ] curl -X POST https://<project>.supabase.co/functions/v1/fix-profile -d '{"userId":"qualquer"}' → deve retornar 404
- [ ] curl https://<project>.supabase.co/functions/v1/debug-env → deve retornar 404
- [ ] curl https://<project>.supabase.co/functions/v1/check-users → deve retornar 404

## Fase 2 — Logs sensíveis
- [ ] Fazer login na app e verificar que o console não exibe o e-mail do usuário
- [ ] Verificar que erros de login ainda aparecem no console (sem o e-mail)

## Fase 3 — Unificação de auth
- [ ] Fazer login com credenciais válidas → deve funcionar normalmente
- [ ] Verificar em Supabase Dashboard > Table Editor > access_logs que um registro foi criado para o login
- [ ] Fazer login com conta suspensa → deve retornar mensagem de conta suspensa

## Fase 4 — Rate limiting
- [ ] Tentar login com senha errada 6 vezes seguidas para o mesmo e-mail → 6ª tentativa deve retornar 429
- [ ] Aguardar 60 segundos e tentar novamente → deve aceitar novamente

## Fase 5 — CORS
- [ ] Testar a app em produção (ipu-calculator.vercel.app) → deve funcionar
- [ ] Testar OPTIONS request de origem externa (ex: outro-projeto.vercel.app) → deve retornar origin da allowlist, não a origem requisitante
```

---

## Ordem de execução e dependências

```
Fase 1 ──────────────────────────────────── independente
Fase 2 ──────────────────────────────────── independente
Fase 3 ──── depende de Fase 2 (mesmo arquivo)
Fase 4 ──────────────────────────────────── independente
Fase 5 ──────────────────────────────────── independente
```

O agente deve executar as fases 1, 2, 4 e 5 em paralelo e a fase 3 após a fase 2.

---

## Restrições para o agente

- **Não alterar** nenhum arquivo fora dos listados em cada fase
- **Não alterar** a assinatura das funções exportadas (`handleCors`, `getCorsHeaders`, `requireAuth`)
- **Não adicionar** dependências novas ao `package.json`
- **Não modificar** arquivos de teste (`.test.ts`, `.spec.ts`)
- **Preservar** todos os comentários de documentação existentes nos arquivos modificados
- Cada arquivo gerado deve ser **completo** — sem `// ... resto do código` ou omissões
