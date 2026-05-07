# 🚀 Fluxo de Trabalho e Deploy (Workflow)

Este guia descreve como organizar as branches e realizar o deploy nos ambientes de Teste (Staging) e Produção.

## 🌿 Estrutura de Branches

| Branch | Ambiente | URL | Finalidade |
| :--- | :--- | :--- | :--- |
| `main` | **Produção** | [Link Oficial](https://ipu-calculator.vercel.app) | Versão estável usada pelos usuários finais. |
| `develop` | **Staging** | [Link de Teste](https://ipu-calculator-staging.vercel.app) | Ambiente de homologação para testes reais antes da main. |
| `refactor` | **Local** | - | Desenvolvimento, refatoração e novas funcionalidades. |

---

## 🛠️ Ciclo de Desenvolvimento (Passo a Passo)

### 1. Trabalhando na Refatoração/Feature
Faça suas alterações sempre na branch `refactor` (ou em branches de feature específicas).
```bash
git checkout refactor
# ... faz o código ...
git add .
git commit -m "feat: minha nova funcionalidade"
git push origin refactor
```

### 2. Enviando para Testes (Staging)
Quando o código estiver pronto para ser testado na Web:
```bash
git checkout develop
git merge refactor
git push origin develop
```
> **Ação**: Acesse o [Link de Teste](https://ipu-calculator-staging.vercel.app) e verifique se tudo funciona.

### 3. Publicando para Produção (Main)
Após validar que tudo está perfeito no Staging:
```bash
git checkout main
git merge develop
git push origin main
```
> **Ação**: O [Link Oficial](https://ipu-calculator.vercel.app) será atualizado automaticamente.

---

## 🌐 Servidor Local (Serve)

Comando para iniciar o servidor local após build:
```bash
# Build da aplicação
npm run build

# Iniciar servidor local (porta 3000)
npx serve dist -l 3000
```

**Problema comum (porta presa):** Erro 404 ou "Address already in use"
```bash
# Matar processo na porta 3000
fuser -k 3000/tcp

# Verificar se há outro processo ocupando
lsof -i :3000
```

**Build limpo:** Se o serve mostrar 404 em todas as rotas, limpe a dist e rebuild:
```bash
rm -rf dist
npm run build
```

---

## ⚠️ Lembretes Importantes
- **Nunca faça commit direto na `main`**: Use sempre o fluxo de merge para evitar quebrar o app oficial.
- **Variáveis de Ambiente**: Se adicionar uma nova chave no `.env` local, lembre-se de adicioná-la também no painel da Vercel (*Settings > Environment Variables*).
- **Configuração de Ambiente**: Use a variável `EXPO_PUBLIC_APP_ENV` para diferenciar os ambientes.
  - `staging`: Habilita ferramentas de debug (ex: Debug Panel). Deve ser configurada no painel da Vercel para o ambiente de Preview/Staging.
  - `production`: Desabilita ferramentas de debug para o usuário final.
- **Conflitos**: Se houver conflito no merge, o VS Code avisará. Resolva os conflitos, salve os arquivos e complete o commit.
- **Lint + Testes antes do Push**: Execute `npm run lint` e `npm test` localmente antes de fazer push para evitar falhas no CI.
- **Porta presa**: Antes de iniciar o serve, verifique se a porta está livre.

## 🔄 Migração de Schema e Sincronização

O app possui sistema automático de migração para preservar dados locais:

- **Como funciona**: Ao abrir o app, `useSyncEngine` executa `schemaMigrationService.migrateIfNeeded()`
- **Quando limpa cache**: **NÃO limpa** - apenas marca modelos `pending` com novo `updatedAt` para re-sync
- **Quando migra**: Só quando o schema do Supabase muda (ex: adiciona/removendo campo)
- **Limpar Cache**: Apenas manualmente ou ao trocar de ambiente (dev → staging → prod)

**Para resetar manualmente** (dev local):
```typescript
// No console do app ou em código
await AsyncStorage.clear();
await AsyncStorage.removeItem('schema_version');
```

## 🧪 Testes

Execute os testes com Jest:
```bash
npm test              # roda todos os testes (100 testes)
npm test -- --watch  # modo watch (reativa ao salvar)
npm test -- --coverage  # com coverage report

# testes por módulo
npm run test:lint        # design-system (Button, Input, Card, Text)
npm run test:core        # core (formatters, parsers)
npm run test:features    # domain logic (calculation, validation)
npm run test:integration # screens + hooks (UI/logic integration)
npm run test:e2e         # Playwright E2E (realtime sync)
```

| Script | Descrição |
| :--- | :--- |
| `test` | Todos os testes (100 testes) |
| `test -- --watch` | Watch mode |
| `test -- --coverage` | Relatório de cobertura |
| `test:lint` | Design system |
| `test:core` | Módulos core |
| `test:features` | Lógica de domínio |
| `test:integration` | Screens + Hooks |
| `test:e2e` | Playwright E2E |

---

## 📋 Tasks Pendentes

| Task | Prioridade | Status |
| :--- | :--- | :--- |
| Corrigir teste `useRealtimeModels.should refetch models when a Realtime event is received` | baixa | skipped |

---

## 🆕 Implementações Recentes (Abril 2026)

### UX & Model Improvements
- **Indicador de Criado/Editado**: Badges azuis (#4A90D9) e laranja (#FF9500) nos cards
- **Feedback de Erro**: Erro inline para modelo duplicado
- **Loading Animation**: Spinner + skeleton cards na tela de Modelos
- **Transições**: Fade-in suave ao carregar lista de modelos
- **Search Melhorado**: Busca em qualquer posição do nome

### Monitoramento & Sincronização
- **Sentry**: Integração com sentry-expo + ErrorBoundary
  - Pendente: configurar DSN na Vercel
- **Background Sync**: Sincronização em segundo plano (Expo TaskManager)
  - Intervalo: 15 minutos
  - Funciona em iOS/Android

---

## 🐛 Debug Panel (Maio 2026)

O DebugPanel é um componente isolado no layout para captura e visualização de erros da aplicação.

### Funcionalidades
- **Captura Global**: `window.onerror`, `unhandledrejection`, override de `console.error` e `console.warn`
- **Sempre Ativo**: O componente permanece montado mesmo quando oculto (para não perder erros)
- **Controle de Visibilidade**: Prop `visible` controla exibição via `display: none`
- **Logs Persistentes**: Armazena até 100 logs com timestamp e tipo (error/warn/info)
- **Status de Rede**: Exibe se o app está online/offline
- **PWA Info**: Exibe informações de debug do PWA (isStandalone, installed, update, version)
- **Limpeza**: Botão para limpar logs manualmente
- **Contador**: Exibe quantidade de erros no cabeçalho

### Como Usar
1. O botão de **inseto (bug icon)** no PWA pill alterna a visibilidade
2. Quando `visible=true`: painel aparece com logs e informações
3. Quando `visible=false`: painel oculto com `display: none` (continua capturando)

### Arquivos
| Arquivo | Descrição |
| :--- | :--- |
| `src/components/DebugPanel.tsx` | Componente isolado |
| `app/_layout.tsx` | Integração via `<DebugPanel visible={showDebug} debugInfo={debugInfo} />` |

### Comportamento Técnico
- **NÃO desmonta**: Mantém `display: none` para preservar captura de erros
- **Captura completa**: Intercepta erros JS, Promises rejeitadas e logs de console
- **Restauração**: Ao desmontar, restaura `console.error` e `console.warn` originais
- **Z-Index**: 9998 (abaixo do PWA pill, acima do conteúdo)

---

## 🧪 Teste de Usabilidade - Check

Antes do teste, execute:

```bash
npm run lint        # validar código
npm run build       # gerar build web
```

**Telas a testar:**
1. ✅ **Modelos** - Loading, busca, badges, animações
2. ✅ **Injeção (IPU)** - Cálculo com modelo
3. ✅ **Calibração** - Fluxo completo
4. ✅ **Offline** - Criar modelo sem internet, verificar sync ao reconectar

**Itens validados:**
- [ ] Loading spinner aparece ao abrir Modelos
- [ ] Skeleton cards durante carregamento
- [ ] Busca encontra texto no meio do nome
- [ ] Badge "Novo" azul aparece em modelos criados
- [ ] Badge "Editado" laranja aparece em modelos editados
- [ ] Erro inline ao tentar criar modelo com nome duplicado
- [ ] Transição suave (fade) ao carregar lista
- [ ] Criar modelo offline funciona
- [ ] Ao reconectar, modelo sincroniza automaticamente

---

## 📝 Commit Standard (Conventional Commits)

All commit messages must be in **English** following the Conventional Commits pattern:

| Type | Description |
| :--- | :--- |
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, missing semi colons, etc; no code change |
| `refactor` | Refactoring production code |
| `test` | Adding missing tests, refactoring tests |
| `chore` | Updating build tasks, package manager configs, etc |

**Format**: `type(scope): description`
**Example**: `feat(sync): implement real-time event system`
---

## 🔐 Fluxo de Segurança e Auth

Este guia define como implementar e manter o sistema de autenticação e autorização do IPU Calculator.

### Arquitetura de Segurança

```
Frontend (Expo/React Native)
  │
  ├─→ Edge Functions (Supabase) ──→ SERVICE_ROLE_KEY (servidor)
  │       │
  │       ├─ auth-login (POST)      - Login + rate limiting
  │       ├─ auth-logout (POST)     - Logout + invalidate
  │       ├─ auth-validate (GET)    - Valida token + profile fresco
  │       ├─ models-sync (POST)     - Upsert modelo
  │       ├─ models-delete (DELETE)- Deleta modelo
  │       ├─ models-get (GET)       - Lista modelos
  │       ├─ admin-users (GET/POST) - Gestão usuários
  │       └─ admin-*(GET)           - Logs, métricas
  │
  └─→ RLS (Supabase) ──→ Políticas no banco
├─ models: SELECT (viewer+), CRUD (editor+)
           ├─ profiles: own profile only
           └─ access_logs: admin only
```

### Ameaças e Mitigações

| ID | Ameaça | Mitigação |
|----|--------|-----------|
| T1 | ANON_KEY no bundle | Todas operações via Edge Functions |
| T2 | Acesso não autorizado | RLS + requireAuth |
| T3 | Escalada de privilégio | Profile validado com servidor a cada restore |
| T4 | Acesso admin por não-admin | useRequireAuth('admin') + requireAuth no servidor |
| T5 | Conta suspensa com sessão | requireAuth verifica active no banco |
| T6 | JWT roubado | sessionStorage (não localStorage) + HTTPS |
| T7 | XSS no PWA | CSP + sessionStorage |
| T8 | CSRF | CORS restrito ao domínio |
| T9 | Enumeração de usuários | Login sempre retorna INVALID_CREDENTIALS |
| T10 | Admin auto-suspensão | Bloqueio no frontend e servidor |

### Variáveis de Ambiente

```bash
# Frontend (.env.local)
EXPO_PUBLIC_EDGE_FUNCTIONS_URL=https://<project>.functions.supabase.co

# Supabase Edge Functions (Dashboard > Edge Functions > Secrets)
ALLOWED_ORIGIN=https://ipu-calculator.vercel.app
SUPABASE_SERVICE_ROLE_KEY=<chave>
```

### Checklist de Implementação de Nova Feature de Segurança

1. **Autorização**: Toda Edge Function chama `requireAuth(req, 'role_minimo')`
2. **Validação**: Server verifica `active` no banco, não confia no JWT cacheado
3. **CORS**: Usar `handleCors` de `_shared/cors.ts`
4. **Logs**: Toda ação relevante chama `logAccess` (fire-and-forget)
5. **Erros**: Nunca vazar stack trace — retornar `INTERNAL_ERROR`
6. **Rate Limiting**: Para endpoints sensíveis (login), implementar via Deno KV
7. **Frontend**: Usar `edgeFunctionsClient` para chamar Edge Functions (não supabaseClient direto)
8. **Proteção de Rotas**: Telas admin devem usar `useRequireAuth('admin')`

### Testes de Segurança

Ver `docs/autentication/plain/security-testing-plan.md` para estratégia completa.

**Níveis:**
- Unitários (Jest): `edgeFunctionsClient`, `modelSyncService`, `AuthProvider`
- Integração (Edge Functions): Authorization, rate limiting, CORS
- E2E (Playwright): Fluxos completos de auth e segurança

---

*Dica: Você pode me pedir para realizar qualquer um desses passos de merge por você!*
