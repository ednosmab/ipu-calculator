# Plano de Testes — Sistema de Segurança

**Data:** 2026-05-07  
**Status:** Planejado

---

## Visão Geral

Este plano define a estratégia de testes para as correções de segurança implementadas, incluindo as Edge Functions migradas e rate limiting.

---

## Estrutura de Testes

### Nível 1 — Testes Unitários (Backend/Edge Functions)

**Local:** `supabase/functions/__tests__/`

| Arquivo | Escopo | Prioridade |
|---------|--------|------------|
| `auth-login-rate-limit.test.ts` | Rate limiting (5 tentativas/60s) | Alta |
| `auth-login-authorization.test.ts` | Permissões por role | Alta |
| `models-sync-authorization.test.ts` | T1 - Authorization de escrita | Alta |
| `models-delete-authorization.test.ts` | T1 - Authorization de delete | Alta |
| `models-get-authorization.test.ts` | T1 - Authorization de leitura | Alta |
| `auth-validate.test.ts` | Validação de sessão | Média |
| `cors-config.test.ts` | T8 - Configuração CORS | Média |

### Nível 2 — Testes Unitários (Frontend)

**Local:** `src/core/api/__tests__/` e `src/core/auth/__tests__/`

| Arquivo | Escopo | Prioridade |
|---------|--------|------------|
| `edgeFunctionsClient.test.ts` | Cliente de chamadas às Edge Functions | Alta |
| `modelSyncService.test.ts` | Service de sync migrado | Alta |
| `AuthProvider.validation.test.ts` | Validação de perfil com servidor (T3) | Alta |

### Nível 3 — Testes E2E (Playwright)

**Local:** `e2e/`

| Arquivo | Escopo | Prioridade |
|---------|--------|------------|
| `rate-limiting.spec.ts` | Rate limiting no login | Alta |
| `security-flows.spec.ts` | Fluxos: login, logout, acesso admin | Alta |
| `edge-functions-integration.spec.ts` | Integração completa Models | Média |

---

## Casos de Teste Detalhados

### TC-01: Rate Limiting no Login

| ID | Cenário | Entrada | Saída Esperada |
|----|---------|---------|----------------|
| TC-01.1 | 5 tentativas falhas | 5x POST /auth-login com senha errada | 5x status 401 |
| TC-01.2 | 6ª tentativa após bloqueio | POST /auth-login (6ª vez) | status 429 |
| TC-01.3 | Tentativa após janela | Esperar 60s, POST /auth-login | status 401 |
| TC-01.4 | Rate limit por email separado | 5x email1 + 1x email2 | email1 bloqueado, email2ok |

### TC-02: Autorização de Models (T1)

| ID | Cenário | Entrada | Saída Esperada |
|----|---------|---------|----------------|
| TC-02.1 | Viewer tentando criar | POST /models-sync (role: viewer) | status 403 |
| TC-02.2 | Viewer tentando deletar | DELETE /models-delete (role: viewer) | status 403 |
| TC-02.3 | Editor criando modelo | POST /models-sync (role: editor) | status 200 |
| TC-02.4 | Editor deletando modelo | DELETE /models-delete (role: editor) | status 200 |
| TC-02.5 | Viewer lendo modelos | GET /models-get (role: viewer) | status 200 |
| TC-02.6 | Conta suspensa tentando | POST /models-sync (active: false) | status 403 |

### TC-03: Validação de Sessão (T3)

| ID | Cenário | Entrada | Saída Esperada |
|----|---------|---------|----------------|
| TC-03.1 | Role mudou no banco | Session restore com GET /auth-validate | Profile atualizado |
| TC-03.2 | Conta suspensa | Session restore com GET /auth-validate | Session limpa |
| TC-03.3 | Offline na validação | Session restore (sem rede) | Usa cache fallback |

### TC-04: CORS (T8)

| ID | Cenário | Entrada | Saída Esperada |
|----|---------|---------|----------------|
| TC-04.1 | Origin não configurada | OPTIONS sem ALLOWED_ORIGIN | Origin: 'null' |
| TC-04.2 | Origin configurada | OPTIONS com origin válida | Origin correta |

---

## Execução

### Script de Testes

```bash
# Testes de Edge Functions (requer setup de test do Supabase)
# Nota: Edge Functions usam Deno, testam localmente via supabase test

# Testes Frontend
npm test -- --testPathPattern="core/api|core/auth"
npm test -- --testPathPattern="features/models/infra"

# Testes E2E
npm run test:e2e -- --grep "rate.limit|security"
```

---

## Dependências para Execução

1. **Variáveis de Ambiente:**
   - `EXPO_PUBLIC_EDGE_FUNCTIONS_URL` configurado
   - `ALLOWED_ORIGIN` no painel Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` para testes de Edge Function

2. **Setup de Teste:**
   - Dados de teste no Supabase (usuários com diferentes roles)
   - Mocks configurados para Deno KV (rate limiting)

3. **Credenciais de Teste:**
   - viewer@test.com / password123
   - editor@test.com / password123
   - admin@test.com / password123
   - suspended@test.com / password123 (active: false)

---

## Critérios de Aceitação

- [ ] TC-01.1 a TC-01.4 passando
- [ ] TC-02.1 a TC-02.6 passando
- [ ] TC-03.1 a TC-03.3 passando
- [ ] TC-04.1 a TC-04.2 passando
- [ ] edgeFunctionsClient tests passando
- [ ] E2E security flows passando

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Deno KV não funciona em ambiente de teste | Usar mock ou ambiente real com cleanup |
| Tempo de teste alto (60s para rate limit) | Testar lógica separadamente do timing |
| Dependência de dados no Supabase | Fixtures em setup |