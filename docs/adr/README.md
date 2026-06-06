# Architecture Decision Records — IPU Calculator

Este diretório documenta as principais decisões técnicas e arquiteturais do projeto.

> Cada registro segue o formato: **Contexto → Decisão → Alternativas → Justificativa**

---

## Índice

### Arquitetura e Estrutura do Projeto
| # | Decisão | Resumo |
|---|---------|--------|
| 01 | [Feature-first Architecture](#01-feature-first-architecture) | Código organizado por feature, não por tipo |
| 02 | [Clean Architecture Layers](#02-clean-architecture-layers) | UI → UseCase → Repository → Domain, dependência unidirecional |
| 03 | [Path Alias `@/`](#03-path-alias) | `@/` mapeia para `src/`, sem imports relativos profundos |
| 04 | [Repository não importa UseCases](#04-repository-não-importa-usecases) | Proibição de dependência circular |
| 05 | [Padrão useCalculatorLogic](#05-padrão-usecalculatorlogic) | Hook genérico de cálculo consumido por hooks específicos |

### Dados e Persistência
| # | Decisão | Resumo |
|---|---------|--------|
| 06 | [Cache com Metadata Envelope](#06-cache-com-metadata-envelope) | `CacheMetadata<T>` com TTL + schemaVersion |
| 07 | [Stale-While-Revalidate](#07-stale-while-revalidate) | Cache expirado retorna dados + refresh em background |
| 08 | [Mutex de Escrita (withWriteLock)](#08-mutex-de-escrita-withwritelock) | Fila de promessas para escrita atômica no AsyncStorage |
| 09 | [Observer Pattern no Repository](#09-observer-pattern-no-repository) | `Set<Listener>` com notificação via setTimeout |
| 10 | [Schema Versioning Semver](#10-schema-versioning-semver) | `CACHE_VERSION.SCHEMA` em major.minor.patch |
| 11 | [Migração Idempotente e Fail-Safe](#11-migração-idempotente-e-fail-safe) | Pode rodar múltiplas vezes; falha crítica limpa cache |
| 12 | [Backup Defensivo Pré-Migração](#12-backup-defensivo-pré-migração) | 3 níveis de recovery: cache → backup → refresh remoto |

### Sincronização e Offline
| # | Decisão | Resumo |
|---|---------|--------|
| 13 | [Arquitetura de Sync em 4 Camadas](#13-arquitetura-de-sync-em-4-camadas) | Hook → UseCase → Repository → Infra/Supabase |
| 14 | [Optimistic UI (Local First)](#14-optimistic-ui-local-first) | Escreve local primeiro, sincroniza em background |
| 15 | [Modelo de Status syncStatus + localAction](#15-modelo-de-status-syncstatus--localaction) | `synced`/`pending` + `created`/`edited`/null |
| 16 | [Version Counter para Merge](#16-version-counter-para-merge) | `version` primeiro, `updatedAt` como desempate |
| 17 | [Fila de Operações Pendentes](#17-fila-de-operações-pendentes) | `pending_deletes` + `pending_edits` com max 3 tentativas |
| 18 | [Flag isFirstRun no Init](#18-flag-isfirstrun-no-init) | Previne sync duplicado no listener de reconexão |
| 19 | [Realtime Bypassa Mutex](#19-realtime-bypassa-mutex) | Eventos remotos usam `createFromRemote`, sem withWriteLock |
| 20 | [Device ID Local-Only](#20-device-id-local-only) | Não enviado ao servidor (privacidade) |

### Autenticação e Segurança
| # | Decisão | Resumo |
|---|---------|--------|
| 21 | [Edge Functions como Única Camada de Dados](#21-edge-functions-como-única-camada-de-dados) | App nunca chama Supabase diretamente |
| 22 | [sessionStorage (Web) + SecureStore (Mobile)](#22-sessionstorage-web--securestore-mobile) | Token some ao fechar aba; criptografado no mobile |
| 23 | [Verificação de active no Banco (não no JWT)](#23-verificação-de-active-no-banco-não-no-jwt) | Suspensão tem efeito imediato |
| 24 | [RBAC Ordinal admin > editor > viewer](#24-rbac-ordinal-admin--editor--viewer) | Hierarquia simples com checagem em 2 camadas |
| 25 | [Auth-validate no Restore de Sessão](#25-auth-validate-no-restore-de-sessão) | Profile fresco do servidor, não do cache |
| 26 | [CORS com Fallback Seguro](#26-cors-com-fallback-seguro) | `'null'` se ALLOWED_ORIGIN não configurado |
| 27 | [Rate Limiting 5/60s no Login](#27-rate-limiting-560s-no-login) | Deno KV, por email |
| 28 | [Sempre INVALID_CREDENTIALS](#28-sempre-invalid_credentials) | Previne enumeração de usuários |
| 29 | [Admin Não Pode se Auto-Suspender](#29-admin-não-pode-se-auto-suspender) | Validação no frontend e no servidor |
| 30 | [Audit Log Fire-and-Forget](#30-audit-log-fire-and-forget) | Falha no log nunca bloqueia a resposta |
| 31 | [Erros Internos sem Stack Trace](#31-erros-internos-sem-stack-trace) | `INTERNAL_ERROR` genérico para o cliente |
| 32 | [Redirecionamento Inteligente Pós-Login](#32-redirecionamento-inteligente-pós-login) | Salva rota original no sessionStorage |
| 33 | [useRequireAuth com 3 Destinos](#33-userequireauth-com-3-destinos) | `/login`, `/suspended`, `/unauthorized` |
| 55 | [auth-login como Única Função Pública](#55-auth-login-como-única-função-pública) | Deploy com `--no-verify-jwt`; todas as outras mantêm `--verify-jwt` |

### UI/UX e Design System
| # | Decisão | Resumo |
|---|---------|--------|
| 34 | [Design System Tokenizado](#34-design-system-tokenizado) | Zero cores hardcoded, tema semântico |
| 35 | [Variants em Componentes Atômicos](#35-variants-em-componentes-atômicos) | Prop `variant` para estado visual |
| 36 | [Menu Drawer Slide Lateral](#36-menu-drawer-slide-lateral) | `Animated.View` com translateX, não Modal nativo |
| 37 | [Animation Tokens](#37-animation-tokens) | 150ms/300ms/500ms + redirect com delay de 1.5s |
| 38 | [Três Estados de Rede (true/false/null)](#38-três-estados-de-rede-truefalsenull) | `null` = verificando, evita UI prematura |
| 39 | [Heartbeat Ativo para Conectividade](#39-heartbeat-ativo-para-conectividade) | `navigator.onLine` + fetch confirmatório |

### PWA e Deploy
| # | Decisão | Resumo |
|---|---------|--------|
| 40 | [Network-First no Service Worker](#40-network-first-no-service-worker) | Sem auto-skip, versão nova aguarda ação do usuário |
| 41 | [Detecção PWA por Sinais do Navegador](#41-detecção-pwa-por-sinais-do-navegador) | `display-mode` + `beforeinstallprompt`, nunca localStorage |
| 42 | [PWA Pill: Install e Update Exclusivos](#42-pwa-pill-install-e-update-exclusivos) | Dois estados mutuamente exclusivos |
| 43 | [Flag isDismissed no PWA Pill](#43-flag-isdismissed-no-pwa-pill) | Bloqueia reativação após dismiss |
| 44 | [EXPO_PUBLIC_APP_ENV para staging](#44-expo_public_app_env-para-staging) | Debug tools só em staging, SW só em staging/prod |
| 45 | [Background Sync a 15 min](#45-background-sync-a-15-min) | Expo TaskManager para iOS/Android |

### Testes e Qualidade
| # | Decisão | Resumo |
|---|---------|--------|
| 46 | [Pirâmide de Testes em 4 Níveis](#46-pirâmide-de-testes-em-4-níveis) | Unit → Integration → Smoke → E2E |
| 47 | [Error Boundary Global + por Feature](#47-error-boundary-global--por-feature) | Falha em cálculo não quebra o app inteiro |
| 48 | [Logger Estruturado com Prefixo](#48-logger-estruturado-com-prefixo) | `[SyncEngine]`, `[modelRepository]`, sem `console.log` |
| 49 | [Zero Empty Catches](#49-zero-empty-catches) | Todo catch deve logar o erro |
| 50 | [Sentry Implementado, DSN Pendente](#50-sentry-implementado-dsn-pendente) | Código pronto, falta configurar env var |

### i18n
| # | Decisão | Resumo |
|---|---------|--------|
| 51 | [Português na UI, Inglês no Código](#51-português-na-ui-inglês-no-código) | translations.ts como fonte única |
| 52 | [Mock Global de i18n nos Testes](#52-mock-global-de-i18n-nos-testes) | Mapa estático `ptLabels` no jest.setup.js |

### Git e Workflow
| # | Decisão | Resumo |
|---|---------|--------|
| 53 | [Git Flow 3 Níveis](#53-git-flow-3-níveis) | refactor → develop → main |
| 54 | [Conventional Commits em Inglês](#54-conventional-commits-em-inglês) | `type(scope): description` |

---

## Registro das Decisões

---

### 01 — Feature-first Architecture

**Contexto:** O projeto precisava de uma estrutura de pastas que isolasse features para facilitar testes e manutenção.

**Decisão:** Código organizado por feature (`src/features/ipu/`, `src/features/models/`, etc.), não por tipo (`screens/`, `hooks/`, `components/`).

**Alternativas:** Estrutura tipo-first (todas screens juntas) ou plana.

**Justificativa:** Isolamento de feature permite testar cada domínio independentemente e reduz acoplamento entre features não relacionadas.

**Arquivos:** `docs/skill/principal_skill.md`, `docs/autentication/agents/agent-refactoring-instructions.md` (Fase 3)

---

### 02 — Clean Architecture Layers

**Contexto:** Era necessário garantir que a lógica de negócio não se misturasse com UI ou infraestrutura.

**Decisão:** Camadas com dependência unidirecional: UI → UseCase → Repository → Domain. Domínio não importa nada.

**Alternativas:** MVC tradicional, ou código inline nas telas.

**Justificativa:** SRP (cada camada tem um trabalho). UseCases orquestram sem saber de UI. Repository isola persistência. Domínio puro é testável sem mocks.

**Arquivos:** `docs/skill/architectural_integrity_protocol.md`

---

### 03 — Path Alias `@/`

**Contexto:** Imports relativos (`../../..`) eram confusos e quebravam com refatorações.

**Decisão:** Alias `@/` mapeia para `src/`. Todos os imports usam este alias.

**Alternativas:** Múltiplos aliases por pasta, ou manter relativos.

**Justificativa:** Simplicidade (um alias apenas) e facilidade de refatoração (nenhum import relativo profundo).

**Arquivos:** `docs/skill/architectural_integrity_protocol.md`, `docs/skill/design-system-master.md`

---

### 04 — Repository não importa UseCases

**Contexto:** Imports circulares entre Repository e UseCase quebravam o bundler web (PWA).

**Decisão:** Repository **nunca** importa UseCase. Se infra precisa de lógica de aplicação, o UseCase coordena a chamada.

**Alternativas:** Repository chamar UseCase diretamente (cria ciclo).

**Justificativa:** Dependências circulares causam erros de `undefined` no JavaScript. Inversão de controle resolve: o UseCase coordena, não o Repository.

**Arquivos:** `docs/skill/architectural_integrity_protocol.md`

---

### 05 — Padrão useCalculatorLogic

**Contexto:** As telas de IPU e Calibração compartilhavam o mesmo padrão (input → validar → calcular → exibir), mas implementavam各自 do seu jeito.

**Decisão:** Hook genérico `useCalculatorLogic` + hook específico por feature (`useIPUCalculator`, `useCalibrationCalculator`).

**Alternativas:** Lógica inline nas telas, ou duplicação.

**Justificativa:** Separa domínio puro (função calculate) da UI. Hooks específicos configuram o genérico. Telas só renderizam.

**Arquivos:** `docs/skill/principal_skill.md`, `docs/skill/design-system-master.md`

---

### 06 — Cache com Metadata Envelope

**Contexto:** Dados salvos diretamente no AsyncStorage não tinham controle de expiração ou versão.

**Decisão:** Todos os dados de cache são envelopados em `CacheMetadata<T>` com `data`, `expiresAt` (48h), `schemaVersion`.

**Alternativas:** Array puro de modelos (proibido).

**Justificativa:** Habilita TTL, invalidação por schema, e migração automática sem quebrar dados existentes.

**Arquivos:** `docs/skill/sync_offline_architecture.md`, `docs/skill/model_persistence_protocol.md`

---

### 07 — Stale-While-Revalidate

**Contexto:** Cache expirado deixava o usuário sem dados até o refresh completar.

**Decisão:** Cache expirado retorna dados imediatamente + dispara refresh em background. Apenas schemaVersion divergente causa hard invalidation.

**Alternativas:** Bloquear UI até refresh, ou não ter cache.

**Justificativa:** Usuário vê dados instantaneamente. Schema mismatch requer invalidação dura para prevenir crash por campos ausentes.

**Arquivos:** `docs/skill/sync_offline_architecture.md`, `docs/skill/model_persistence_protocol.md`

---

### 08 — Mutex de Escrita (withWriteLock)

**Contexto:** Duas funções concorrentes lendo e escrevendo no AsyncStorage causavam perda de dados.

**Decisão:** Fila de promessas (`writeQueue`) que serializa todas as escritas no AsyncStorage.

**Alternativas:** Lock otimista, ou sem proteção.

**Justificativa:** AsyncStorage não é transacional. Duas operações simultâneas de "ler-tudo → modificar → salvar-tudo" causamRace Conditions. A fila serializa atomicamente.

**Arquivos:** `docs/skill/model_persistence_protocol.md`, `docs/skill/sync_offline_architecture.md`

---

### 09 — Observer Pattern no Repository

**Contexto:** UI precisava reagir a mudanças no cache sem polling ou Context global.

**Decisão:** `Set<Listener>` no Repository, notificado via `setTimeout(notify, 0)`.

**Alternativas:** React Context, polling periódico, EventEmitter.

**Justificativa:** `Set` evita listeners duplicados. `setTimeout` evita bloquear o ciclo de renderização. Simples e sem dependências externas.

**Arquivos:** `docs/skill/model_persistence_protocol.md`

---

### 10 — Schema Versioning Semver

**Contexto:** Mudanças no `CalculationModel` (adição/remoção de campos) quebravam o cache existente.

**Decisão:** `CACHE_VERSION.SCHEMA` em formato semver (`2.1.0`). Minor para campos novos, major para breaking changes. Cada bump requer migração.

**Alternativas:** Inteiro simples, ou sem versionamento.

**Justificativa:** Semver comunica o impacto da mudança. O `schemaMigrationService` transforma dados existentes em vez de destruí-los.

**Arquivos:** `docs/skill/schema_migration_protocol.md`, `docs/skill/cache_versioning_protocol.md`

---

### 11 — Migração Idempotente e Fail-Safe

**Contexto:** Migrações que rodavam duas vezes corrompiam dados.

**Decisão:** Migrações são idempotentes (podem rodar N vezes). Se falharem criticamente, app limpa cache e faz refresh remoto em vez de crashar.

**Alternativas:** Rollback automático, ou crash.

**Justificativa:** Idempotência permite re-executar com segurança. Fail-safe (limpar cache) é melhor que app quebrado — usuário sempre pode re-baixar do servidor.

**Arquivos:** `docs/skill/schema_migration_protocol.md`

---

### 12 — Backup Defensivo Pré-Migração

**Contexto:** Uma migração mal-sucedida poderia perder todos os modelos locais do usuário.

**Decisão:** `schemaMigrationService.backup()` salva em `@ipu:models_backup` antes de migrar. `modelRepository.getAll()` tenta 3 níveis: cache → backup → refresh remoto.

**Alternativas:** Sem backup, ou backup versionado.

**Justificativa:** Defesa em profundidade. Cache corrompido → tenta backup. Backup falha → limpa e busca do servidor. Backup não é versionado porque migrações são idempotentes (deliberadamente baixa prioridade).

**Arquivos:** `docs/backlog.md` (Item 6)

---

### 13 — Arquitetura de Sync em 4 Camadas

**Contexto:** Sincronização precisa ser resiliente offline e orquestrar múltiplos passos (buscar, mesclar, enviar pendentes, processar deletes).

**Decisão:** 4 camadas: Hook (ciclo de vida) → UseCase (orquestração) → Repository (persistência local) → Infra (Supabase).

**Alternativas:** Tudo em um hook gigante, ou lógica de sync espalhada.

**Justificativa:** Separa responsabilidades. UseCases são testáveis sem UI. Repository é substituível. Hooks são finos.

**Arquivos:** `docs/skill/sync_offline_architecture.md`

---

### 14 — Optimistic UI (Local First)

**Contexto:** Usuário não deve esperar o servidor para ver sua ação refletida na tela.

**Decisão:** Escreve no cache local primeiro (instantâneo), depois sincroniza em background. UI nunca espera o servidor.

**Alternativas:** Write-through (esperar servidor), ou offline-only.

**Justificativa:** App funcional sem internet. Sincronização é bônus, não bloqueio. Item offline aparece com badge "pendente".

**Arquivos:** `docs/skill/optimistic_ui_sync_indicators.md`, `docs/skill/background_sync_orchestration.md`, `docs/skill/model_persistence_protocol.md`

---

### 15 — Modelo de Status syncStatus + localAction

**Contexto:** Precisávamos distinguir "salvo no servidor" de "criado/editado offline".

**Decisão:** Dois campos: `syncStatus: 'synced' | 'pending'` e `localAction: 'created' | 'edited' | null`.

**Alternativas:** Booleano `isSynced` (menos granular).

**Justificativa:** Permite UI com badge "Novo" (criado offline) vs "Editado" (alterado offline). O `localAction` indica qual operação fazer no sync.

**Arquivos:** `docs/skill/sync_offline_architecture.md`, `docs/skill/optimistic_ui_sync_indicators.md`

---

### 16 — Version Counter para Merge

**Contexto:** Dois dispositivos editando offline podiam ter o mesmo `updatedAt` (timestamp), causando perda de dados.

**Decisão:** Merge usa `version` primeiro. Se igual, fallback para `updatedAt`. Version incrementa a cada escrita local.

**Alternativas:** Apenas timestamp (anterior), CRDT (complexo demais).

**Justificativa:** Version counter previne conflito de mesmo timestamp. CRDT foi descartado (YAGNI).

**Arquivos:** `docs/backlog.md` (Itens 2 e 8)

---

### 17 — Fila de Operações Pendentes

**Contexto:** Operações offline (criar/editar/deletar) precisam ser re-enviadas quando a conexão voltar.

**Decisão:** Duas filas: `@ipu:pending_deletes` (array de IDs) e `@ipu:pending_edits` (array de `PendingOperation`). Máximo de 3 tentativas por operação.

**Alternativas:** Fila única, retry infinito, ou descarte silencioso.

**Justificativa:** Separar deletes de edits evita conflitos. 3 tentativas evita loop infinito. Após exceder, item permanece local mas é removido da fila (log warn).

**Arquivos:** `docs/skill/sync_offline_architecture.md`, `docs/skill/background_sync_orchestration.md`

---

### 18 — Flag isFirstRun no Init

**Contexto:** O listener de reconexão disparava sync antes do init inicial terminar, causando duplicação.

**Decisão:** `isFirstRun.current = false` apenas no `finally` do init, nunca antes.

**Alternativas:** setTimeout para init, ou flag booleana simples.

**Justificativa:** Se setado cedo, o listener race-condition contra o fetch inicial. No finally garante que o init completo ocorreu antes de permitir re-sync.

**Arquivos:** `docs/skill/sync_offline_architecture.md`

---

### 19 — Realtime Bypassa Mutex

**Contexto:** Eventos remotos do Supabase Realtime competiam com escritas locais pelo mutex, causando deadlock.

**Decisão:** Eventos Realtime usam métodos dedicados (`createFromRemote`, `removeLocal`) que **não** passam por `withWriteLock`.

**Alternativas:** Usar withWriteLock para tudo (risco de deadlock).

**Justificativa:** Eventos remotos são idempotentes e não devem ser bloqueados por contenção de escrita local.

**Arquivos:** `docs/skill/sync_offline_architecture.md`

---

### 20 — Device ID Local-Only

**Contexto:** Precisávamos de identificação de dispositivo para debugar logs de sync.

**Decisão:** `deviceId` gerado com `crypto.randomUUID()` + AsyncStorage, usado apenas em logs locais. **Não** enviado ao servidor.

**Alternativas:** Enviar deviceId no SyncMetadata (rastreamento).

**Justificativa:** `version` já resolve conflitos. Enviar UUID persistente expõe rastreamento sem benefício real. Pode ser adicionado no futuro se necessário.

**Arquivos:** `docs/backlog.md` (Item 3)

---

### 21 — Edge Functions como Única Camada de Dados

**Contexto:** ANON_KEY exposta no bundle permitia acesso direto ao Supabase.

**Decisão:** App nunca chama Supabase diretamente. Toda comunicação passa por Edge Functions que usam SERVICE_ROLE_KEY (servidor).

**Alternativas:** Chamadas diretas com RLS (anterior), ou Supabase client-side com anon key.

**Justificativa:** Isola SERVICE_ROLE_KEY do cliente. RLS continua ativo como defesa em profundidade. Mesmo com ANON_KEY vazada, não há acesso a dados.

**Arquivos:** `docs/autentication/skill/security_threat_model.md`, `docs/autentication/sumary/security-implementation-completed-may-2026.md`

---

### 22 — sessionStorage (Web) + SecureStore (Mobile)

**Contexto:** Token JWT precisava ser armazenado com segurança em ambas as plataformas.

**Decisão:** Web: `window.sessionStorage` (some ao fechar aba). Mobile: `expo-secure-store` (criptografado).

**Alternativas:** `localStorage` (persiste indefinidamente, acessível via XSS), `AsyncStorage` (sem criptografia).

**Justificativa:** `sessionStorage` reduz janela de exposição XSS. `SecureStore` criptografa o token no dispositivo.

**Arquivos:** `docs/autentication/skill/authentication_protocol.md`, `docs/autentication/skill/security_threat_model.md`

---

### 23 — Verificação de active no Banco (não no JWT)

**Contexto:** JWT não é revogável — alteração de active no banco não invalidava tokens existentes.

**Decisão:** `requireAuth` verifica `active` no banco a **cada requisição**. Não confia na claim do JWT.

**Alternativas:** Confiar só no JWT (suspensão só efetiva após expirar token).

**Justificativa:** Suspensão deve ser imediata. JWT pode durar horas. Verificar banco em tempo real garante efeito instantâneo.

**Arquivos:** `docs/autentication/skill/security_threat_model.md`, `docs/autentication/skill/rbac_protocol.md`

---

### 24 — RBAC Ordinal admin > editor > viewer

**Contexto:** Era necessário controle de acesso granular sem complexidade.

**Decisão:** Três roles em hierarquia ordinal: `admin > editor > viewer`. Admin herda permissões de editor e viewer. Verificação em 2 camadas: Edge Function + RLS.

**Alternativas:** Permissões planas, ABAC, bitmask.

**Justificativa:** Suficiente para o contexto. Comparação por índice de array é simples. Dupla verificação (código + banco) é defesa em profundidade.

**Arquivos:** `docs/autentication/skill/rbac_protocol.md`, `docs/autentication/plain/security_implementation_plan.md`

---

### 25 — Auth-validate no Restore de Sessão

**Contexto:** Profile cacheado podia estar desatualizado (role mudou, conta suspensa) e o app não sabia.

**Decisão:** Ao restaurar sessão, `AuthProvider` chama `GET /auth-validate` para obter profile fresco do servidor. Se falhar, usa cache como fallback.

**Alternativas:** Confiar cegamente no cache.

**Justificativa:** Role mudou ou conta foi suspensa? A validação com servidor detecta. Se estiver offline, o cache funciona como fallback (não bloqueia o app).

**Arquivos:** `docs/autentication/sumary/security-fixes-may-2026.md`

---

### 26 — CORS com Fallback Seguro

**Contexto:** CORS anterior usava `'*'` como fallback, aceitando qualquer origem.

**Decisão:** Se `ALLOWED_ORIGIN` não estiver configurado, fallback é `'null'` (rejeita todas). Além disso, origens `.vercel.app` são auto-permitidas.

**Alternativas:** `'*'` (anterior, inseguro), ou lista estática.

**Justificativa:** `.vercel.app` cobre preview branches automaticamente. `'null'` é seguro por padrão.

**Arquivos:** `docs/skill/network_cors_protocol.md`, `docs/autentication/sumary/security-fixes-may-2026.md`

---

### 27 — Rate Limiting 5/60s no Login

**Contexto:** Sem limite de tentativas, atacante podia testar senhas indefinidamente.

**Decisão:** 5 tentativas falhas por email a cada 60 segundos via Deno KV. Retorna 429 quando excedido.

**Alternativas:** Sem rate limit, ou por IP.

**Justificativa:** Email-based previne brute force por usuário. Deno KV é o storage nativo do Supabase para Edge Functions.

**Arquivos:** `docs/autentication/sumary/security-implementation-completed-may-2026.md`

---

### 28 — Sempre INVALID_CREDENTIALS

**Contexto:** Mensagens diferentes para "email não existe" vs "senha errada" permitiam enumerar usuários válidos.

**Decisão:** Login sempre retorna `INVALID_CREDENTIALS`, independente do erro real.

**Alternativas:** Diferenciar os erros.

**Justificativa:** Atacante não consegue determinar se um email está registrado. Mitiga T9 (enumeração de usuários).

**Arquivos:** `docs/autentication/skill/security_threat_model.md`

---

### 29 — Admin Não Pode se Auto-Suspender

**Contexto:** Admin podia suspender a própria conta acidentalmente e perder acesso ao painel.

**Decisão:** Validação dupla: frontend (UI desabilita ação) e servidor (`targetId === user.id && active === false` retorna 400).

**Alternativas:** Apenas no frontend, ou apenas no servidor.

**Justificativa:** Frontend previne acidente. Servidor previne bypass malicioso. Defesa em profundidade.

**Arquivos:** `docs/autentication/skill/rbac_protocol.md`, `docs/autentication/skill/edge_functions_protocol.md`

---

### 30 — Audit Log Fire-and-Forget

**Contexto:** Falha no log não deveria impedir a operação principal.

**Decisão:** `logAccess()` é chamado sem `await`. Falha no log não propaga erro para a resposta.

**Alternativas:** Log síncrono (await — se DB lento, resposta atrasa).

**Justificativa:** "Log nunca bloqueia a operação principal." Se o insert de log falha, a ação do usuário ainda é concluída.

**Arquivos:** `docs/autentication/skill/edge_functions_protocol.md`, `docs/autentication/skill/access_logs_metrics_protocol.md`

---

### 31 — Erros Internos sem Stack Trace

**Contexto:** Stack traces expostas vazavam detalhes da implementação do servidor.

**Decisão:** Erros internos retornam `{ error: 'INTERNAL_ERROR' }` (500). Erros específicos: `UNAUTHORIZED` (401), `FORBIDDEN` (403), `ACCOUNT_SUSPENDED` (403).

**Alternativas:** Retornar o erro real com stack trace.

**Justificativa:** Previne vazamento de informação. O detalhe completo fica no `console.error` do servidor.

**Arquivos:** `docs/autentication/skill/edge_functions_protocol.md`, `docs/autentication/skill/security_threat_model.md`

---

### 32 — Redirecionamento Inteligente Pós-Login

**Contexto:** Login sempre redirecionava para `/models`, mesmo se o usuário veio de outra rota.

**Decisão:** Se usuário tentou acessar rota protegida → salva no sessionStorage → redireciona de volta após login. Se foi direto pra `/login` → admin vai pra `/admin/users`, outros vão pra `/models`.

**Alternativas:** Sempre `/models`, ou sempre `/`.

**Justificativa:** UX: usuário volta exatamente pra onde tentou ir. Admin tem landing page mais relevante.

**Arquivos:** `docs/plans/003-navigation-improvements.md`, `docs/plans/archive/004-navigation-fix.md`

---

### 33 — useRequireAuth com 3 Destinos

**Contexto:** Redirecionamento único para `/login` não informava o motivo (conta suspensa, role insuficiente).

**Decisão:** Três destinos: `/login` (não autenticado), `/suspended` (conta inativa), `/unauthorized` (role insuficiente). Guard `isLoading` previne flash de conteúdo.

**Alternativas:** Single redirect, ou renderizar nada durante verificação.

**Justificativa:** Usuário entende exatamente por que não pode acessar. `isLoading` evita flash de conteúdo protegido.

**Arquivos:** `docs/autentication/skill/authentication_protocol.md`, `docs/autentication/plain/security_implementation_plan.md`

---

### 34 — Design System Tokenizado

**Contexto:** Cores hexadecimais e valores hardcoded espalhados causavam inconsistência visual.

**Decisão:** Todos os tokens (cores, spacing, tipografia) centralizados em `theme.ts`. Nomes semânticos (`successBg`, `warning`), não físicos (`lightGreen`). Zero hardcoded colors.

**Alternativas:** CSS modules, inline styles, styled-components.

**Justificativa:** Consistência visual garantida. Tema como única fonte de verdade. Nomes semânticos comunicam propósito, não aparência.

**Arquivos:** `docs/skill/design_system_tokenization_protocol.md`, `docs/skill/design-system-master.md`

---

### 35 — Variants em Componentes Atômicos

**Contexto:** Cada tela criava seus próprios estilos para variações visuais (success card, error card).

**Decisão:** Componentes atômicos (Card, Button, Text) aceitam prop `variant`. Telas compõem átomos em vez de redefinir estilos.

**Alternativas:** Inline styles condicionais, ou classes CSS.

**Justificativa:** Variants controladas sem duplicação. Feature components herdam tokens do tema.

**Arquivos:** `docs/skill/design_system_tokenization_protocol.md`

---

### 36 — Menu Drawer Slide Lateral

**Contexto:** Modal nativo do React Native só anima de baixo pra cima, mas o design pedia slide lateral esquerda→direita.

**Decisão:** Implementação customizada com `Animated.View` (translateX de -280 a 0) + scrim com opacidade. Não usa `Modal`.

**Alternativas:** Modal nativo (animação incorreta).

**Justificativa:** `Modal` não suporta animação horizontal. `Animated.View` + `usePathname` permite rota ativa destacada.

**Arquivos:** `docs/plans/archive/004-navigation-fix.md`, `docs/skill/side_navigation_design.md`

---

### 37 — Animation Tokens

**Contexto:** Animações com durações arbitrárias causavam sensação inconsistente.

**Decisão:** Tokens: Fast 150ms (micro-interações), Normal 300ms (modais/transições), Slow 500ms (erros críticos). Redirect tem delay de 1.5s + fade antes do `router.replace()`.

**Alternativas:** Durações hardcoded, redirect instantâneo.

**Justificativa:** Consistência visual. Redirect com aviso prévio (toast + delay) evita transição brusca.

**Arquivos:** `docs/skill/animation_protocol.md`

---

### 38 — Três Estados de Rede (true/false/null)

**Contexto:** Estado binário de rede causava flicker na UI durante verificação inicial.

**Decisão:** `useNetworkStatus` retorna `true` (conectado), `false` (offline), `null` (verificando).

**Alternativas:** Binário true/false.

**Justificativa:** `null` permite UI saber que "ainda está verificando" e não mostrar banner offline prematuramente.

**Arquivos:** `docs/skill/network_connectivity_protocol.md`

---

### 39 — Heartbeat Ativo para Conectividade

**Contexto:** `navigator.onLine` reporta false positives (WiFi sem internet, captive portals).

**Decisão:** `navigator.onLine` como dica inicial + heartbeat confirmatório para `google.com/favicon.ico` (no-cors, no-store, timeout 3s).

**Alternativas:** Só `navigator.onLine` (não confiável).

**Justificativa:** Captive portals e WiFi sem sinal enganam o navegador. Heartbeat confirma conectividade real.

**Arquivos:** `docs/skill/network_connectivity_protocol.md`

---

### 40 — Network-First no Service Worker

**Contexto:** Cache-first servia versões antigas do app mesmo após deploy.

**Decisão:** Network-first (tenta rede primeiro, cache é fallback). `self.skipWaiting()` removido (nova versão aguarda ação do usuário).

**Alternativas:** Cache-first, ou auto-skip (força reload, risco de perda de dados).

**Justificativa:** Network-first garante versão mais recente. Sem auto-skip para não forçar reload no meio do uso do usuário.

**Arquivos:** `docs/skill/pwa_lifecycle_protocol.md`

---

### 41 — Detecção PWA por Sinais do Navegador

**Contexto:** `localStorage` e env vars eram usados para detectar instalação, mas não eram confiáveis.

**Decisão:** Usar `window.matchMedia('(display-mode: standalone)')` para standalone e `beforeinstallprompt` para installability. Nunca localStorage.

**Alternativas:** localStorage flags, env vars.

**Justificativa:** "Confie exclusivamente nos sinais reais do navegador." display-mode e beforeinstallprompt são a fonte de verdade.

**Arquivos:** `docs/skill/pwa_lifecycle_protocol.md`

---

### 42 — PWA Pill: Install e Update Exclusivos

**Contexto:** Botão de instalar e aviso de atualização apareciam juntos, confundindo o usuário.

**Decisão:** Dois estados mutuamente exclusivos: "Instalar" (`!isStandalone && canInstall`) ou "Atualizar" (`isStandalone && updateAvailable`).

**Alternativas:** Estado combinado, ou notificação única.

**Justificativa:** Install é aquisição, update é manutenção. Nunca mostrar ambos simultaneamente.

**Arquivos:** `docs/skill/pwa_lifecycle_protocol.md`

---

### 43 — Flag isDismissed no PWA Pill

**Contexto:** Após fechar o PWA pill, um timeout de 5s no Android o reabria.

**Decisão:** Ref `isDismissed` bloqueia todas as reativações (timeout, beforeinstallprompt, instruções manuais) após dismiss ou instalação concluída.

**Alternativas:** Apenas `setCanInstall(false)` (sobrescrito pelo timeout).

**Justificativa:** No Android, um fallback de 5s reativava `canInstall`. A flag persiste e bloqueia qualquer reativação.

**Arquivos:** `docs/plain/implementation_plan.md`

---

### 44 — EXPO_PUBLIC_APP_ENV para staging

**Contexto:** Debug tools e Service Worker precisavam de comportamento diferente por ambiente.

**Decisão:** `EXPO_PUBLIC_APP_ENV=staging` ativa Debug Panel. SW só registra em staging/production. `development` e `undefined` = dev mode (sem SW).

**Alternativas:** Build configs separadas, feature flags.

**Justificativa:** Variável única controla debug tools e SW. Evita erro "Not found" do Metro ao tentar registrar SW no dev server.

**Arquivos:** `docs/summary/sw-debug-panel-may-2026.md`

---

### 45 — Background Sync a 15 min

**Contexto:** Sincronização em background precisava balancear atualização e consumo de bateria.

**Decisão:** Intervalo de 15 minutos via Expo TaskManager. Disponível apenas em iOS/Android nativo.

**Alternativas:** Push-based, intervalo menor/maior.

**Justificativa:** 15 min equilibra frescor dos dados com bateria/banda. Web depende de sync em foreground.

**Arquivos:** `docs/workflow/ipu_calculator-workflow.md`

---

### 46 — Pirâmide de Testes em 4 Níveis

**Contexto:** Precisávamos de confiança em diferentes escalas (unidade, integração, deploy, E2E).

**Decisão:** 4 níveis: Unit (Jest, funções puras) → Integration (RNTL, hooks+screens mockados) → Smoke (manual checklist) → E2E (Playwright, fluxos críticos).

**Alternativas:** 2 níveis (unit + e2e), ou sem smoke.

**Justificativa:** Cada nível pega um tipo de erro. Unit → lógica. Integration → wiring. Smoke → deploy/ambiente. E2E → comportamento real multi-tab.

**Arquivos:** `docs/skill/testing_protocol.md`

---

### 47 — Error Boundary Global + por Feature

**Contexto:** Um erro em tela de cálculo derrubava o app inteiro (header, menu, navegação).

**Decisão:** ErrorBoundary global (app/_layout.tsx) + boundaries por feature. Fallback com "Tentar Novamente" que faz `window.location.reload()`.

**Alternativas:** Apenas boundary global.

**Justificativa:** Falha em feature secundária não deve derrubar navegação principal. Hard reload é último recurso para corrompimento de estado em memória.

**Arquivos:** `docs/skill/resilient_error_handling.md`, `docs/backlog.md` (Item 5)

---

### 48 — Logger Estruturado com Prefixo

**Contexto:** `console.log` espalhado sem contexto dificultava debug.

**Decisão:** `logger.info/warn/error` com prefixo de módulo obrigatório: `[SyncEngine]`, `[modelRepository]`, etc. `console.log` proibido em código de produção.

**Alternativas:** console.log puro, ou sem logging.

**Justificativa:** Prefixos permitem filtrar logs por módulo. "Toda falha silenciosa é um bug em produção que nunca será corrigido."

**Arquivos:** `docs/skill/error_handling_observability.md`

---

### 49 — Zero Empty Catches

**Contexto:** `catch {}` vazios engoliam erros que nunca seriam descobertos.

**Decisão:** Todo `catch` deve logar o erro (warn/error). Apenas exceção: propagar para ErrorBoundary.

**Alternativas:** Permitir empty catches para operações não-críticas.

**Justificativa:** Erros não-críticos (ex: sync) também precisam ser diagnosticados. Empty catch esconde bugs.

**Arquivos:** `docs/skill/error_handling_observability.md`

---

### 50 — Sentry Implementado, DSN Pendente

**Contexto:** Sentry é desejado para monitoramento remoto, mas DSN é secreto e não deve estar no código.

**Decisão:** Código do Sentry integrado no ErrorBoundary. DSN será configurado via env var na Vercel (pending).

**Alternativas:** Sem Sentry, ou DSN hardcoded.

**Justificativa:** Código pronto para ativar quando o DSN for configurado. DSN não é commitado por segurança.

**Arquivos:** `docs/skill/error_handling_observability.md`, `docs/workflow/ipu_calculator-workflow.md`

---

### 51 — Português na UI, Inglês no Código

**Contexto:** App para engenheiros brasileiros, mas código precisa ser legível internacionalmente.

**Decisão:** UI em Português via `translations.ts` (fonte única). Código (variáveis, funções, commits, comentários) em Inglês.

**Alternativas:** UI em Inglês, ou código em Português.

**Justificativa:** Domínio é Português (Isocianato, Poliol). Código em Inglês para colaboração internacional. TypeScript deriva tipos das chaves `pt`, garantindo paridade com `en`.

**Arquivos:** `docs/skill/i18n_protocol.md`, `docs/skill/clean_code_architect.md`

---

### 52 — Mock Global de i18n nos Testes

**Contexto:** Import do sistema de tradução quebrava testes com erro de transformação Babel.

**Decisão:** Mock global em `jest.setup.js` com mapa estático `ptLabels`. Testes usam textos em Português para seletores.

**Alternativas:** Mock por arquivo, ou sem mock (testes quebram).

**Justificativa:** Evita erros de transformação. Testes legíveis com texto real em Português. Mapa precisa ser atualizado quando novas strings são adicionadas.

**Arquivos:** `docs/skill/i18n_integration_protocol.md`

---

### 53 — Git Flow 3 Níveis

**Contexto:** Precisávamos de staging entre desenvolvimento e produção sem complexidade de Git Flow completo.

**Decisão:** Três níveis: `refactor` (desenvolvimento) → `develop` (staging, deploy automático) → `main` (produção). Sempre via merge/PR.

**Alternativas:** Git Flow completo, GitHub Flow, trunk-based.

**Justificativa:** Staging como ambiente de teste antes de produção. `bump.yml` auto-bumpa versão no push para `develop`. Simples o suficiente para time de 1 desenvolvedor.

**Arquivos:** `docs/skill/git_workflow.md`, `docs/workflow/ipu_calculator-workflow.md`

---

### 54 — Conventional Commits em Inglês

**Contexto:** Mensagens de commit sem padrão dificultavam changelog e versionamento.

**Decisão:** `type(scope): description` em Inglês. Tipos: feat, fix, docs, style, refactor, test, chore.

**Alternativas:** Português, sem padrão.

**Justificativa:** Formato padronizado permite gerar changelog automático. Inglês alinhado com "código em Inglês".

**Arquivos:** `docs/skill/git_workflow.md`, `docs/workflow/ipu_calculator-workflow.md`

---

### 55 — auth-login como Única Função Pública

**Contexto:** O edge function `auth-login` precisa ser invocado por usuários **antes** de terem um JWT válido — é o endpoint que entrega o token. Porém, o Supabase CLI aplica `--verify-jwt` por padrão em todos os deploys, o que faz o gateway retornar `401 UNAUTHORIZED_NO_AUTH_HEADER` para chamadas anônimas. Resultado: chicken-and-egg (precisa de token pra chamar a função, mas precisa chamar a função pra ter token). Em maio/2026 esse problema causou falha de login em produção que só foi diagnosticada após o app exibir `INVALID_CREDENTIALS` (mensagem genérica, sem indicar que o gateway estava bloqueando).

**Decisão:** Deploy de `auth-login` **sempre** com flag `--no-verify-jwt`. Todas as demais Edge Functions (`auth-validate`, `models-sync`, `models-delete`, `models-get`, `admin-*`) continuam com `--verify-jwt` (default) para exigir JWT válido.

```bash
# auth-login (público — recebe credenciais, devolve token)
npx supabase functions deploy auth-login --project-ref <ref> --no-verify-jwt

# todas as outras (autenticadas — exigem JWT)
npx supabase functions deploy models-sync --project-ref <ref>
npx supabase functions deploy models-delete --project-ref <ref>
npx supabase functions deploy admin-users --project-ref <ref>
# etc.
```

**Alternativas:**

- **Forçar o app a enviar um JWT falso** — não funciona; gateway valida assinatura.
- **Refatorar login para usar Supabase Auth nativo direto** — quebra o `ADR-21` (Edge Functions como única camada de dados) e perde o audit log automático.
- **Criar endpoint separado de "token exchange"** — over-engineering para o porte do projeto.

**Justificativa:**

- **Mínima superfície pública:** apenas `auth-login` é exposta sem auth — todas as outras 9+ funções continuam exigindo JWT válido.
- **Defesa em profundidade mantida:** `auth-login` ainda valida credenciais via `supabase.auth.signInWithPassword` (não confia em payload do cliente); rate limiting (5/min/email) no in-memory; audit log de tentativas falhas.
- **Diagnóstico explícito:** gateway retorna `UNAUTHORIZED_NO_AUTH_HEADER` (não `INVALID_CREDENTIALS`), o que torna o problema óbvio se voltar a ocorrer.
- **Compatibilidade:** o comando de deploy é o mesmo, só com um flag a mais — fácil de documentar em script CI/CD.

**Comando de verificação pós-deploy:**

```bash
# Deve funcionar SEM Authorization header (login anônimo)
curl -s -X POST "https://<project>.supabase.co/functions/v1/auth-login" \
  -H "Content-Type: application/json" \
  -H "apikey: <anon_key>" \
  -d '{"email":"x@x.com","password":"wrong"}'
# Esperado: 401 INVALID_CREDENTIALS (NÃO UNAUTHORIZED_NO_AUTH_HEADER)

# Deve BLOQUEAR sem Authorization header (função autenticada)
curl -s -X POST "https://<project>.supabase.co/functions/v1/models-sync" \
  -H "Content-Type: application/json" \
  -H "apikey: <anon_key>" \
  -d '{}'
# Esperado: 401 UNAUTHORIZED_NO_AUTH_HEADER
```

**Arquivos:** `supabase/functions/auth-login/index.ts`, `.github/workflows/ci.yml` (futuro: automatizar deploy com flag correto).

---

## ❌ Fora de Escopo (Decisões Explícitas de Não Implementar)

| Decisão | Motivo |
|---------|--------|
| Microserviços | Over-engineering para app single-developer |
| CRDT / Event Sourcing | Version counter já resolve conflitos |
| Reescrever sincronização inteira | Arquitetura atual funciona |
| Observabilidade enterprise (Datadog, NewRelic) | Incompatível com orçamento/porte atual |
| Abstrações prematuras (factories, adapters) | YAGNI |
| 100% de cobertura de testes | Cobertura crítica já atingida |
| Refresh token rotativo | JWT de curta duração é suficiente por enquanto |
| Segundo fator (SMS/TOTP) | Custo e fricção desnecessários |
| Criptografia em repouso no Supabase | Dados não são PII crítico |

---

*Documento gerado em 2026-05-26. Última atualização: 2026-06-05.*
