# Guia Técnico Completo — IPU Calculator

> **Plataforma:** React Native + Expo (web/PWA, iOS, Android)  
> **Backend:** Supabase (Edge Functions + PostgreSQL)  
> **Última atualização:** Maio 2026

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Fluxo Completo da Aplicação](#4-fluxo-completo-da-aplicação)
5. [Sistema de Autenticação](#5-sistema-de-autenticação)
6. [Sistema Offline-First](#6-sistema-offline-first)
7. [Mecanismo de Sincronização](#7-mecanismo-de-sincronização)
8. [Camada de Domínio](#8-camada-de-domínio)
9. [Design System](#9-design-system)
10. [Arquitetura Frontend](#10-arquitetura-frontend)
11. [Integração com Supabase](#11-integração-com-supabase)
12. [PWA e Service Worker](#12-pwa-e-service-worker)
13. [CI/CD e Automação](#13-cicd-e-automação)
14. [Testes](#14-testes)
15. [Sistema de Governança e IA](#15-sistema-de-governança-e-ia)
16. [Segurança](#16-segurança)
17. [Explicação Arquivo por Arquivo](#17-explicação-arquivo-por-arquivo)
18. [Decisões Arquiteturais](#18-decisões-arquiteturais)

---

## 1. Visão Geral da Arquitetura

### 1.1 Propósito do Sistema

O **IPU Calculator** é uma aplicação técnica projetada para engenheiros que trabalham com poliuretano. Ela resolve dois problemas fundamentais:

1. **Cálculo de IPU (Índice de Poliuretano)** — determina a proporção ideal entre isocianato e poliol
2. **Calibração de Vazão** — ajusta máquinas injetoras usando regra de três

Além dos cálculos, o sistema permite:
- Gerenciar modelos de cálculo (CRUD completo)
- Operar offline com sincronização automática
- Compartilhar dados entre dispositivos via Supabase
- Controlar acesso por níveis de permissão (RBAC)

### 1.2 Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                        APLICAÇÃO                             │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Telas   │  │   Hooks  │  │  UseCases │  │ Repository│   │
│  │  (UI)     │→ │  (state) │→ │(lógica)   │→ │ (dados)  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       │                          │              │            │
│  ┌────┴────┐                ┌────┴────┐   ┌────┴────┐      │
│  │Design   │                │ Domínio  │   │Async    │      │
│  │System   │                │(pure fn) │   │Storage  │      │
│  └─────────┘                └─────────┘   └─────────┘      │
│                                                  │           │
│                    ┌──────────┐  ┌──────────┐    │           │
│                    │  Auth    │  │  Edge    │    │           │
│                    │ Provider │→ │ Functions│←───┘           │
│                    └──────────┘  └────┬─────┘                │
│                                       │                       │
└───────────────────────────────────────┼───────────────────────┘
                                        │
                                  ┌─────┴──────┐
                                  │   Supabase  │
                                  │  PostgreSQL │
                                  └────────────┘
```

### 1.3 Princípios Arquiteturais

| Princípio | Aplicação |
|-----------|-----------|
| **Clean Architecture** | Camadas com dependência unidirecional: UI → UseCase → Repository → Domain |
| **Offline-First** | Cache local é a fonte primária; servidor é secundário |
| **Feature-First** | Código organizado por funcionalidade (ipu, calibration, models) |
| **Optimistic UI** | UI reflete mudanças instantaneamente; sync é assíncrono |
| **DRY** | Hooks genéricos (useCalculatorLogic) compartilhados entre features |
| **YAGNI** | Sem abstrações prematuras; apenas o necessário para o momento |
| **DIP** | Dependências apontam para abstrações (interfaces implícitas) |
| **SRP** | Cada arquivo resolve um único problema |

### 1.4 Fluxo Global da Aplicação

```
1. App inicia (SplashScreen)
2. Carrega fontes e recursos
3. PWAInstallProvider monta
4. AuthProvider restaura sessão do storage
5. TranslationProvider carrega idioma
6. ToastProvider prepara notificações
7. ErrorBoundary envolve todo o app
8. useSyncEngine inicia:
   a. schemaMigrationService.migrateIfNeeded()
   b. syncModelsUseCase() — envia pendentes locais
   c. fetchRemoteModelsUseCase() — busca remotos + merge
   d. processPendingDeletesUseCase()
   e. processPendingEditsUseCase()
9. Roteamento (Expo Router) renderiza tela inicial
10. Interação do usuário dispara cálculos, navegação, etc.
```

### 1.5 Modelo Offline-First

O sistema adota uma estratégia **offline-first** com três camadas de defesa:

1. **Cache Local (AsyncStorage)**: Todos os modelos são salvos localmente com TTL de 48h
2. **Backup Defensivo**: Antes de migrações, um backup é criado em chave separada
3. **Recovery Automático**: Se o cache corromper, tenta backup; se backup falha, limpa e força refresh remoto

```
FLUXO DE LEITURA:
1. Tenta ler do AsyncStorage
2. Cache expirado? → Retorna dados + refresh background
3. Schema desatualizado? → Invalida e retorna []
4. Cache corrompido? → Tenta backup → Tenta refresh remoto
5. Tudo falhou? → Retorna [] (app funcional sem dados)
```

---

## 2. Stack Tecnológica

### 2.1 Frontend

| Tecnologia | Versão | Propósito |
|-----------|--------|-----------|
| React Native | 0.81.5 | Framework mobile cross-platform |
| Expo | ~54.0.34 | Camada de tooling e build |
| Expo Router | ~6.0.23 | Roteamento file-based |
| React | 19.1.0 | Biblioteca de UI |
| TypeScript | ~5.9.2 | Tipagem estática |
| Zod | ^4.3.6 | Validação de schemas |
| AsyncStorage | 2.2.0 | Persistência local |
| Supabase JS | ^2.104.1 | Cliente Supabase |
| React Native Web | ~0.21.0 | Renderização web |
| Sentry Expo | ~7.0.0 | Monitoramento de erros (pendente DSN) |

### 2.2 Infraestrutura

| Componente | Tecnologia |
|-----------|-----------|
| **Backend** | Supabase (PostgreSQL + Edge Functions) |
| **Autenticação** | Supabase Auth (email/senha) |
| **Realtime** | Supabase Realtime (WebSocket) |
| **Deploy Web** | Vercel (PWA) |
| **Deploy Mobile** | Expo (iOS/Android) |
| **CI/CD** | GitHub Actions |
| **Testes** | Jest + React Native Testing Library + Playwright |

### 2.3 Serviços Externos

- **Supabase**: banco de dados, autenticação, edge functions, realtime
- **Vercel**: hospedagem do PWA com previews automáticos
- **GitHub Actions**: CI/CD, bump de versão, lint, testes
- **Sentry**: (pendente) monitoramento de erros em produção
- **Expo TaskManager**: sync em background no mobile

---

## 3. Estrutura de Pastas

### 3.1 Raiz do Projeto

```
calculadora-ipu/
├── app/                    # Rotas e telas (Expo Router file-based)
├── src/                    # Código fonte principal
│   ├── components/         # Componentes de UI genéricos
│   ├── core/              # Camada de infraestrutura compartilhada
│   ├── design-system/     # Sistema de design (átomos)
│   ├── features/          # Módulos de funcionalidade (feature-first)
│   ├── hooks/             # Hooks genéricos e de aplicação
│   └── i18n/              # Internacionalização
├── supabase/              # Backend Supabase
│   ├── functions/         # Edge Functions (Deno/TypeScript)
│   └── migrations/        # Migrações SQL
├── public/                # Assets estáticos do PWA
├── scripts/               # Automações (bump, deploy, build)
├── e2e/                   # Testes E2E Playwright
├── .github/               # GitHub Actions workflows
└── docs/                  # Documentação do projeto
```

### 3.2 Pasta `app/` — Rotas e Telas

```
app/
├── _layout.tsx         # Layout raiz (providers, fontes, bootstrap)
├── +html.tsx           # Custom HTML template (PWA)
├── index.tsx           # Home Screen (rota /)
├── login.tsx           # Tela de login
├── models.tsx          # Tela de modelos
├── calculator.tsx      # Calculadora IPU
├── calibration.tsx     # Calibração de vazão
├── suspended.tsx       # Conta suspensa
├── unauthorized.tsx    # Acesso negado
└── admin/              # Painel administrativo
    ├── index.tsx       # Redirect para /admin/users
    ├── users/          # Gestão de usuários
    ├── logs/           # Logs de auditoria
    └── metrics/        # Métricas de uso
```

**Arquitetura de Rotas:** O Expo Router usa file-based routing, onde cada arquivo na pasta `app/` corresponde a uma rota. `_layout.tsx` é o layout raiz que envolve todas as rotas, fornecendo providers e estrutura global.

#### `app/_layout.tsx` — Bootstrap da Aplicação

**Responsabilidade:** Ponto de entrada da aplicação. Gerencia:
1. Carregamento de fontes (FontAwesome5)
2. SplashScreen (prevenção de flash)
3. Providers: AuthProvider, TranslationProvider, ToastProvider, PWAInstallProvider
4. Service Worker registration (apenas staging/production)
5. useSyncEngine (inicialização da sincronização)
6. Background sync registration (mobile, 15 min)
7. UpdateBanner (atualização PWA)
8. DebugPanel (desenvolvimento/staging)
9. NavMenu (menu hamburger global)
10. ErrorBoundary global

#### `app/login.tsx` — Tela de Login

**Fluxo:**
1. Usuário preenche email + senha
2. Valida campos obrigatórios
3. Chama `signIn()` do AuthProvider
4. Se sucesso: redireciona via `getPostLoginRedirect()`
5. Se falha: exibe mensagem de erro específica (INVALID_CREDENTIALS, ACCOUNT_SUSPENDED, INTERNAL_ERROR)
6. Estado offline: exibe botão "Acessar Offline (Cache)" se `isConnected !== true` e `hasCache === true`

### 3.3 Pasta `src/core/` — Infraestrutura Compartilhada

```
src/core/
├── api/
│   └── edgeFunctionsClient.ts    # Cliente centralizado Edge Functions
├── auth/
│   ├── AuthContext.tsx           # Contexto de autenticação
│   ├── AuthProvider.tsx          # Provider de autenticação
│   └── sessionStorage.ts         # Adapter de sessão (web + nativo)
├── calculations/
│   └── mathCalculations.ts       # Funções matemáticas auxiliares
├── constants/
│   └── ipuConstants.ts           # Constantes do domínio IPU
├── device/
│   └── deviceId.ts              # ID único do dispositivo
├── formatters/
│   └── numberFormatter.ts        # Formatação de números
├── infra/
│   └── supabaseClient.ts         # Cliente Supabase JS
├── logging/
│   ├── logger.ts                 # Logger simples (dev apenas)
│   └── LogService.ts             # Logger com handlers
├── monitoring/
│   └── sentryService.ts          # Integração Sentry (pending DSN)
├── parsers/
│   └── numberParser.ts           # Parse de números (input do usuário)
├── storage/
│   ├── asyncStorageClient.ts     # Cliente AsyncStorage genérico
│   └── storageKeys.ts            # Constantes de chaves do storage
├── sync/
│   └── backgroundSyncService.ts  # Sync em background (mobile)
├── toast/
│   └── ToastProvider.tsx         # Sistema de toast notifications
├── versioning/
│   └── cacheVersion.ts           # Versionamento de cache
├── config.ts                     # Configurações centralizadas
├── types.ts                      # Tipos compartilhados
├── validators.ts                  # Validadores genéricos
└── version.ts                    # Versão do app
```

### 3.4 Pasta `src/features/` — Módulos de Funcionalidade

Cada feature segue a estrutura Clean Architecture:

```
src/features/<feature>/
├── domain/          # Entidades e regras de negócio (zero dependências)
│   ├── *.ts         # Funções puras, schemas, interfaces
│   └── __tests__/   # Testes unitários do domínio
├── application/     # Casos de uso (orquestração)
│   ├── *.ts         # UseCases
│   └── __tests__/   # Testes dos use cases
├── infra/           # Implementações concretas (repositórios)
│   ├── *.ts         # Acesso a dados, API calls
│   └── __tests__/   # Testes de infra
├── hooks/           # Hooks específicos da feature
│   └── *.ts         # Custom hooks
├── components/      # Componentes visuais da feature
│   └── *.tsx        # Subcomponentes
└── screens/         # Telas da feature
    ├── *.tsx        # Tela principal
    ├── *.styles.ts  # Estilos (opcional)
    └── *.test.tsx   # Testes de integração da tela
```

#### Features Implementadas:

| Feature | Descrição |
|---------|-----------|
| `ipu/` | Cálculo de IPU (isocianato + poliol) |
| `calibration/` | Calibração de vazão (regra de três) |
| `models/` | CRUD de modelos + sincronização |
| `history/` | Histórico de cálculos recentes |
| `home/` | Tela inicial |

### 3.5 Pasta `src/hooks/` — Hooks Genéricos

```
src/hooks/
├── useAuth.ts                # Acesso ao AuthContext
├── useCalculatorLogic.ts     # Hook genérico de cálculo
├── useNetworkStatus.ts       # Status de rede (híbrido web/mobile)
├── usePermissions.ts         # Permissões por role
├── usePWAInstall.tsx         # Instalação PWA
├── useRequireAuth.ts         # Proteção de rotas
├── useServiceWorkerUpdate.ts # Atualização do Service Worker
├── useSyncEngine.ts          # Motor de sincronização
├── useToast.ts               # Acesso ao ToastContext
└── admin/                    # Hooks do painel admin
    ├── useAdminUsers.ts
    ├── useAdminLogs.ts
    └── useAdminMetrics.ts
```

### 3.6 Pasta `src/design-system/` — Sistema de Design

```
src/design-system/
├── theme.ts                  # Tokens de tema (cores, spacing, tipografia)
├── index.ts                  # Barrel exports
└── components/               # Componentes atômicos
    ├── Button.tsx
    ├── Card.tsx
    ├── Header.tsx
    ├── HStack.tsx
    ├── Input.tsx
    ├── Text.tsx
    ├── Toggle.tsx
    └── VStack.tsx
```

### 3.7 Pasta `supabase/` — Backend

```
supabase/
├── functions/
│   ├── _shared/              # Helpers compartilhados
│   │   ├── authMiddleware.ts # requireAuth()
│   │   ├── auditLogger.ts    # logAccess()
│   │   ├── cors.ts           # handleCors()
│   │   └── response.ts       # ok(), err()
│   ├── auth-login/           # POST - Login
│   ├── auth-logout/          # POST - Logout
│   ├── auth-validate/        # GET - Validar sessão
│   ├── models-get/           # GET - Listar modelos
│   ├── models-sync/          # POST - Sincronizar modelo
│   ├── models-delete/        # DELETE - Remover modelo
│   ├── admin-users/          # GET/POST - Usuários
│   ├── admin-users-update/   # PATCH - Atualizar user
│   ├── admin-users-delete/   # DELETE - Remover user
│   ├── admin-logs/           # GET - Logs com filtros
│   ├── admin-metrics/        # GET - Métricas
│   └── (debug functions)     # Utilitários de debug
└── migrations/
    ├── 001_auth_security.sql   # Tabelas + RLS
    ├── 002_fix_profiles_rls.sql
    ├── 003_fix_auth_hook.sql
    └── 004_add_version_to_models.sql
```

### 3.8 Pasta `scripts/` — Automações

```
scripts/
├── bump-version.js           # Bump automático de versão
├── inject-sw-version.js      # Injeta versão no SW
├── merge-to-develop.sh       # Script de merge
├── reset-project.js          # Reset do projeto Expo
└── sync-readme.js            # Sincroniza README
```

### 3.9 Pasta `.github/workflows/` — CI/CD

```
.github/workflows/
├── ci.yml                   # Lint + testes + build (push/PR)
├── bump.yml                 # Bump de versão (push develop)
├── preview-comment.yml      # Comenta URL do preview
└── refactor-readme.yml      # Atualiza README automaticamente
```

---

## 4. Fluxo Completo da Aplicação

### 4.1 Inicialização (Bootstrap)

```
1. Expo carrega o entry point (expo-router/entry)
2. SpashScreen.preventAutoHideAsync() — previne flash
3. RootLayout (app/_layout.tsx) monta:
   a. PWAInstallProvider — contexto de instalação PWA
   b. Font.useFonts() — carrega FontAwesome5
   c. useEffect:
      - Registra Service Worker (staging/prod)
      - Inicializa useSyncEngine()
      - Registra background sync (mobile)
   d. Quando fontes carregam → SplashScreen.hideAsync()
   e. Renderiza AppContent:
      - AuthProvider: tenta restaurar sessão
      - TranslationProvider: carrega idioma
      - ToastProvider: prepara notificações
      - ErrorBoundary: captura erros globais
      - Stack: renderiza rota atual
      - NavMenu: menu hamburger global
      - UpdateBanner: se nova versão disponível
      - DebugPanel: se ambiente dev/staging
```

### 4.2 Bootstrap do AuthProvider

```
1. AuthProvider monta → isLoading = true
2. useEffect(async ()):
   a. Promise.all([
        sessionStorage.getToken(),
        sessionStorage.getProfile()
      ])
   b. Se token + profile existem:
      - fetchWithTimeout(SUPABASE_URL/auth/v1/user, 3s)
      - Se servidor OK:
        → fetchProfile(token, userId)
          • Tenta REST API (SUPABASE_URL/rest/v1/profiles)
          • Fallback: Edge Function auth-validate
          • Default: { role: 'viewer', active: true }
        → setSession, setUser, setProfile
        → sessionStorage.setProfile(JSON.stringify)
      - Se servidor rejeita:
        → sessionStorage.clearAll()
      - Se timeout/erro:
        → Usa cache local (profile do sessionStorage)
   c. Se falha crítica → loga warning
   d. Finally: setIsLoading(false)
3. Resto do app renderiza baseado em isLoading
```

### 4.3 Bootstrap do SyncEngine

```
useSyncEngine() hook:
1. useNetworkStatus() retorna isConnected (true/false/null)
2. Quando isConnected === true:
   a. schemaMigrationService.migrateIfNeeded()
      - Compara CACHE_VERSION.SCHEMA com o salvo
      - Se diferente: backup() → getModels() → saveModels()
   b. runSync():
      - syncModelsUseCase(): envia pendentes locais
      - fetchRemoteModelsUseCase(): busca remotos + merge
      - processPendingDeletesUseCase()
      - processPendingEditsUseCase()
3. Monitora reconexão:
   - Se prevConnected === false && isConnected === true
   - Dispara runSync() novamente
```

### 4.4 Ciclo de Renderização

```
Tela (e.g., ModelsScreen)
  ↓
Hook (useRealtimeModels)
  ├─ Aguarda authLoading === false
  ├─ fetchRemoteModelsUseCase() (se online + user)
  └─ modelRepository.getAll() (cache local)
  ↓
modelRepository.getAll()
  ├─ asyncStorageClient.get('@ipu:models')
  ├─ Verifica schemaVersion
  ├─ Verifica expiresAt (48h TTL)
  └─ Retorna dados ou [] (com refresh background)
  ↓
State (models, isLoading)
  ↓
Componentes de UI (ModelList, ModelCard)
  ↓
Renderização condicional:
  - isLoading → Skeleton + Spinner
  - empty → "Nenhum modelo salvo"
  - dados → Lista com Animated fade-in
```

### 4.5 Ciclo de Cálculo

```
User input → Input onChangeText → setInputValue(key, value)
  ↓
User clica "Calcular" → calculate()
  ↓
1. parseNumber(inputs[key]) para cada campo
2. Zod schema validation (se configurado)
3. Se erro → setFieldErrors + setError global
4. Se OK → config.calculateFn(...args)
5. formatToUserView(result)
6. setResult(string formatada)
  ↓
UI exibe resultado em ResultCard

CICLO DE SALVAR COMO MODELO:
1. User clica "Salvar como Modelo"
2. createModelUseCase({ name, type, inputs })
3. Verifica duplicata (case-insensitive)
4. Cria CalculationModel com:
   - id: crypto.randomUUID()
   - version: 1
   - syncStatus: 'pending'
   - localAction: 'created'
5. modelRepository.create(model)
6. UI atualiza instantaneamente
7. Background: modelSyncService.syncToRemote(model)
```

---

## 5. Sistema de Autenticação

### 5.1 Arquitetura

```
┌──────────────────────┐
│    AuthProvider       │  ← Contexto global
│  (src/core/auth/)     │
├──────────────────────┤
│  sessionStorage.ts   │  ← Adapter por plataforma
│  AuthContext.tsx      │  ← Interface de dados
│  AuthProvider.tsx     │  ← Lógica de autenticação
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   Edge Functions      │  ← Backend Supabase
├──────────────────────┤
│  POST /auth-login    │  ← Login
│  POST /auth-logout   │  ← Logout
│  GET /auth-validate  │  ← Validar sessão
└──────────────────────┘
```

### 5.2 Fluxo de Login

```
1. User preenche email + senha
2. signIn(email, password):
   a. fetch POST SUPABASE_URL/auth/v1/token?grant_type=password
      Headers: apikey + Content-Type
      Body: { email, password }
   b. Se !res.ok → throw Error(error_description)
   c. Extrai access_token + userData
   d. fetchProfile(access_token, userId):
      - Tenta REST API (profiles?select=id,name,role,active)
      - Se falha: fallback Edge Function auth-validate
      - Se falha: default { role: 'viewer', active: true }
   e. Promise.all([
        sessionStorage.setToken(access_token),
        sessionStorage.setProfile(JSON.stringify(profile))
      ])
   f. setSession, setUser, setProfile
3. Router redireciona via getPostLoginRedirect():
   - Se havia rota salva → volta para ela
   - Se admin → /admin
   - Se viewer/editor → /models
```

### 5.3 sessionStorage — Adapter por Plataforma

**Decisão arquitetural:** Usar `sessionStorage` no web e `expo-secure-store` no nativo.

- **Web (`sessionStorage`):** Token some ao fechar a aba — reduz janela de exposição XSS
- **Mobile (`expo-secure-store`):** Dados criptografados nativamente — nunca `AsyncStorage` para tokens

```typescript
// Lógica de detecção de plataforma
const isWeb = typeof window !== 'undefined';

// Web → sessionStorage
// Nativo → SecureStore
export const sessionStorage = {
  async getToken(): Promise<string | null> {
    if (isWeb) return window.sessionStorage.getItem(SESSION_KEY);
    return SecureStore.getItemAsync(SESSION_KEY);
  },
  // setToken, clearToken, getProfile, setProfile, clearProfile...
};
```

### 5.4 Proteção de Rotas (useRequireAuth)

```typescript
useRequireAuth(minRole: Role = 'viewer', options?) => {
  isLoading, isAuthorized
}
```

**Fluxo de decisão:**
```
isLoading || isCheckingCache → aguarda
!user && canAccessOffline → permite (offline)
!user → salva rota atual → router.replace('/login')
user && !profile.active → router.replace('/suspended')
user.role < minRole → router.replace('/unauthorized')
senão → isAuthorized = true
```

### 5.5 Hierarquia de Permissões (usePermissions)

```typescript
const ROLE_HIERARCHY: Role[] = ['viewer', 'editor', 'admin'];
// admin herda todas as permissões
// editor herda de viewer + escrita
// viewer apenas leitura
```

| Role | Ler Modelos | Criar/Editar | Painel Admin |
|------|-------------|-------------|-------------|
| viewer | ✅ | ❌ | ❌ |
| editor | ✅ | ✅ | ❌ |
| admin | ✅ | ✅ | ✅ |

---

## 6. Sistema Offline-First

### 6.1 Arquitetura de Persistência

```
AsyncStorage
├── @ipu:models           ← Cache principal (CacheMetadata)
├── @ipu:models_backup    ← Backup pré-migração
├── @ipu:pending_deletes  ← IDs de modelos para deletar
├── @ipu:pending_edits    ← Operações de edição pendentes
├── @ipu:schema_version   ← Versão do schema
├── @ipu:cache_version    ← Versão do cache
├── @ipu:device_id        ← ID único do dispositivo
├── @ipu:history          ← Histórico de cálculos
├── @ipu:settings         ← Configurações do app
└── @ipu:language         ← Idioma selecionado
```

### 6.2 CacheMetadata — Envelope de Dados

Todos os dados de cache são envelopados em `CacheMetadata<T>`:

```typescript
interface CacheMetadata {
  data: CalculationModel[];     // Dados reais
  expiresAt: number;            // Date.now() + 48h (TTL)
  schemaVersion?: string;       // CACHE_VERSION.SCHEMA
}
```

**Por que envelopar?**
- Habilita TTL (stale-while-revalidate)
- Habilita invalidação por schema
- Permite migração automática sem quebrar dados existentes

### 6.3 Estratégia de Leitura (Stale-While-Revalidate)

```
modelRepository.getAll()
1. asyncStorageClient.get('@ipu:models')
2. Se não existe → recoveryAndRefresh()
3. Se schemaVersion diferente → invalida → retorna []
4. Se expiresAt passou → retorna dados + fetch em background
5. Se erro crítico → recoveryAndRefresh()
6. Retorna data[]

recoveryAndRefresh():
1. Tenta schemaMigrationService.restoreBackup()
2. Se backup OK → chama getAll(true) recursivamente
3. Se backup falha → limpa cache + força fetchRemoteModelsUseCase()
4. Retorna []
```

### 6.4 Mutex de Escrita (withWriteLock)

**Problema:** AsyncStorage não é transacional — operações simultâneas de "ler-tudo → modificar → salvar-tudo" causam race conditions.

**Solução:** Fila de promessas que serializa todas as escritas:

```typescript
let writeQueue = Promise.resolve();

const withWriteLock = <T>(fn: () => Promise<T>, opName: string): Promise<T> => {
  const next = writeQueue.then(async () => {
    try { return await fn(); }
    finally { /* log */ }
  });
  writeQueue = next;
  return next;
};

// Uso:
await withWriteLock(async () => {
  const existing = await getAll();
  const updated = [newModel, ...existing];
  await _saveToStorage(updated);
  notify();
}, 'create-local');
```

### 6.5 Observer Pattern — Notificação de Mudanças

```typescript
type ModelListener = () => void;
const listeners: Set<ModelListener> = new Set();

// Subscribe retorna função de cleanup
subscribe: (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Notificação assíncrona (não bloqueia renderização)
const notify = () => {
  setTimeout(() => {
    listeners.forEach(listener => listener());
  }, 0);
};
```

### 6.6 Três Níveis de Recovery

```
1º NÍVEL: Cache corrompido → tenta restaurar do backup
2º NÍVEL: Backup falha → limpa cache + força refresh remoto
3º NÍVEL: Offline sem backup → retorna [] (app funcional)
```

---

## 7. Mecanismo de Sincronização

### 7.1 Arquitetura de Sync

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│ useSyncEngine│────▶│ runSync()    │────▶│ UseCases      │
│ (hook)      │     │              │     │               │
└─────────────┘     └──────────────┘     └───────────────┘
                                               │
                      ┌────────────────────────┼────────────────┐
                      ▼                        ▼                ▼
              syncModelsUseCase()    fetchRemoteModelsUseCase()  process*
                      │                        │                │
                      ▼                        ▼                ▼
              modelSyncService        edgeFunctionsClient   pendingOpsService
              .syncToRemote()         .getModels()          .getPending*
                      │                        │
                      ▼                        ▼
              POST /models-sync        GET /models-get
              (Edge Function)          (Edge Function)
```

### 7.2 Fluxo de Sincronização

```
INIT (isConnected === true):
1. schemaMigrationService.migrateIfNeeded()
   → backup() → getModels() → saveModels()
2. syncModelsUseCase()
   → Filtra modelos syncStatus === 'pending'
   → Para cada: modelSyncService.syncToRemote()
   → Se sucesso: updateLocal({ ...model, syncStatus: 'synced' })
3. fetchRemoteModelsUseCase()
   → edgeFunctionsClient.getModels()
   → Merge: version > local.version → substitui
   → Se version == local.version → updatedAt desempata
   → Filtra: mantém pending + remoteIds
   → modelRepository.saveWithLock(merged)
4. processPendingDeletesUseCase()
   → pendingOpsService.getPendingDeletes()
   → Para cada: modelSyncService.deleteFromRemote()
   → Se sucesso: removePendingDelete() + removeLocal()
5. processPendingEditsUseCase()
   → pendingOpsService.getPendingEdits()
   → Para cada: modelSyncService.syncToRemote()
   → Se sucesso: removePendingEdit() + updateLocal()
   → Se falha: attempts++ (max 3, então remove)

RECONEXÃO:
useSyncEngine monitora useNetworkStatus
prevConnected === false && isConnected === true → runSync()
```

### 7.3 Modelo de Status

```typescript
interface CalculationModel {
  // ...
  syncStatus: 'synced' | 'pending';
  localAction: 'created' | 'edited' | null;
  version: number;  // Incrementado a cada escrita local
  updatedAt: number; // Timestamp para desempate
}
```

| syncStatus | localAction | Significado Visual |
|------------|-------------|-------------------|
| `synced` | `null` | Salvo no servidor — badge azul (criado) ou laranja (editado) |
| `pending` | `'created'` | Criado offline — aguarda sync |
| `pending` | `'edited'` | Editado offline — aguarda sync |

### 7.4 Estratégia de Merge (Version + Timestamp)

```
PARA CADA MODELO REMOTO:
1. Procura por ID no cache local
2. Se encontrou:
   a. remote.version > local.version → substitui
   b. remote.version === local.version:
      - remote.updatedAt > local.updatedAt → substitui
      - senão → mantém local
3. Se não encontrou:
   a. Adiciona ao cache
4. FILTRO FINAL:
   - Mantém modelos pending (nunca remove dados locais não sincronizados)
   - Mantém modelos synced que existem no remoto
   - Remove synced que não existem mais no remoto
```

### 7.5 Operações Pendentes (Filas)

```typescript
// pending_deletes: string[] (apenas IDs)
// pending_edits: PendingOperation[]
// Máximo de tentativas: 3

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  model?: CalculationModel;
  attempts: number;
  lastAttempt: number;
  error?: string;
}
```

### 7.6 Background Sync (Mobile)

```typescript
// Expo TaskManager + BackgroundFetch
// Intervalo: 15 minutos
// Apenas iOS/Android nativo (web ignora)

registerBackgroundSync():
1. TaskManager.defineTask('background-sync-task', async () => {
   syncModelsUseCase()
   fetchRemoteModelsUseCase()
   processPendingDeletesUseCase()
   processPendingEditsUseCase()
   return NewData
})
2. BackgroundFetch.registerTaskAsync(task, {
   minimumInterval: 15 * 60 // 15 min
})
```

### 7.7 Realtime Sync (WebSocket)

O hook `useRealtimeModels` mantém uma conexão WebSocket com o Supabase Realtime para receber notificações de mudanças em tempo real:

```typescript
channel = supabase.channel('realtime-models');
channel.on(
  'postgres_changes',
  { event: '*', schema: 'public', table: 'models' },
  (payload) => fetchModels(true) // refetch
);
channel.subscribe((status) => {
  // CHANNEL_ERROR ou TIMED_OUT → modo local
  // SUBSCRIBED → conectado
});
```

---

## 8. Camada de Domínio

### 8.1 Cálculo de IPU

```typescript
// src/features/ipu/domain/calculateIPU.ts
// Fórmula: (isocyanate + polyol) / REFERENCE_DIVISOR

export const calculateIPU = (isocyanate: number, polyol: number): number => {
  return (isocyanate + polyol) / IPU_CONSTANTS.REFERENCE_DIVISOR;
};
```

**Schema de validação (Zod):**

```typescript
// src/features/ipu/domain/ipuSchema.ts
export const ipuSchema = z.object({
  isocyanate: z.number().positive('deve ser maior que zero'),
  polyol: z.number().positive('deve ser maior que zero'),
});
```

### 8.2 Cálculo de Calibração

```typescript
// src/features/calibration/domain/calculateCalibration.ts
// Fórmula: (targetWeight * machineValue) / actualWeight

export const calculateCalibration = (
  targetWeight: number,
  machineValue: number,
  actualWeight: number
): number => {
  if (actualWeight === 0) return 0; // Guard contra divisão por zero
  return (targetWeight * machineValue) / actualWeight;
};
```

### 8.3 Modelo de Dados (CalculationModel)

```typescript
// src/features/models/domain/calculationModel.ts

export interface CalculationModel {
  id: string;                    // UUID
  name: string;                  // Nome do modelo
  type: ModelType;               // 'ipu' | 'calibration'
  inputs: Record<string, number>; // { isocyanate: 0.0771, polyol: 0.1506 }
  createdAt: number;             // Timestamp de criação
  updatedAt: number;             // Timestamp de última modificação
  version: number;               // Contador de versão (incrementa a cada escrita)
  syncStatus: 'synced' | 'pending';
  localAction: 'created' | 'edited' | null;
}

// Validação Zod
export const modelSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: 'Nome é obrigatório' }),
  type: z.enum(['ipu', 'calibration']),
  inputs: z.record(z.string(), z.number()),
  createdAt: z.number(),
  updatedAt: z.number(),
  version: z.number(),
  syncStatus: z.enum(['synced', 'pending']),
  localAction: z.enum(['created', 'edited']).nullable(),
});
```

### 8.4 Schema Migration Service

```typescript
// src/features/models/application/schemaMigrationService.ts

schemaMigrationService.migrateIfNeeded():
1. needsMigration() → compara savedVersion com CACHE_VERSION.SCHEMA
2. Se precisa migrar:
   a. backup() → salva em @ipu:models_backup
   b. getModels() → lê dados atuais
   c. Para cada modelo pending → atualiza updatedAt
   d. saveModels() → salva com nova versão
   e. Salva CACHE_VERSION.SCHEMA
3. Retorna { migrated: boolean, count: number }
```

---

## 9. Design System

### 9.1 Filosofia

**Zero hardcoded colors, zero inline styles.** Todos os tokens visuais centralizados no tema.

### 9.2 Tokens do Tema

```typescript
// src/design-system/theme.ts

export const theme = {
  colors: {
    bg: '#0B0C0F',              // Fundo escuro
    surface: '#121418',          // Superfície de cards
    input: '#1C1F26',            // Fundo de inputs
    primary: '#00F5D4',          // Verde turquesa (cor principal)
    primaryDim: 'rgba(0,245,212,0.1)',
    success: '#00F5D4',
    text: '#FFFFFF',
    textSecondary: '#9BA1A6',
    error: '#FF3B30',
    warning: '#FF9500',
    badgeCreated: '#4A90D9',     // Azul (modelo novo)
    badgeEdited: '#FF9500',      // Laranja (modelo editado)
    border: '#2C3036',
    overlay: 'rgba(0,0,0,0.7)',
    // ...
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  roundness: { sm: 8, md: 12, lg: 16, full: 9999 },
  borderWidth: { thin: 1, medium: 1.5, thick: 2 },
  typography: {
    sizes: { xs: 12, sm: 14, md: 16, lg: 20, xl: 28 },
    weights: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  },
  animations: {
    durations: { fast: 150, normal: 300, slow: 500, redirect: 1500 },
  },
};
```

### 9.3 Componentes Atômicos

| Componente | Propósito | Variantes |
|-----------|-----------|-----------|
| `Button` | Botão com estados | primary, secondary, disabled, loading |
| `Input` | Campo de texto | error, helperText |
| `Card` | Container de conteúdo | default, success |
| `Text` | Texto estilizado | — |
| `HStack` | Layout horizontal | gap, style |
| `VStack` | Layout vertical | gap, style |
| `Toggle` | Alternância | — |
| `Title` | Título de página | xl, centered (padrão) |

### 9.4 Padrão de Tela

```tsx
<ScreenLayout title="Injeção">
  <Card>
    <VStack>
      <Input label="Isocianato" value={...} error={...} />
      <Input label="Poliol" value={...} error={...} />
    </VStack>
  </Card>
  <Button title="Calcular" onPress={calculate} />
  <ResultCard result={result} />
</ScreenLayout>
```

---

## 10. Arquitetura Frontend

### 10.1 Padrão Hook Genérico + Hook Específico

```
useCalculatorLogic (genérico)
├── useIPUCalculator
│   ├── inputs: ['isocyanate', 'polyol']
│   ├── calculateFn: calculateIPU
│   └── validationSchema: ipuSchema
│
└── useCalibrationCalculator
    ├── inputs: ['targetWeight', 'machineValue', 'actualWeight']
    ├── calculateFn: calculateCalibration
    └── validationSchema: calibrationSchema
```

### 10.2 Hook Genérico useCalculatorLogic

```typescript
const useCalculatorLogic = <T extends string>(config: CalculatorConfig<T>) => {
  // inputs: Record<T, string> — valores dos campos
  // result: string | null — resultado formatado
  // error: string | null — erro global
  // fieldErrors: Record<T, string | null> — erros por campo

  // setInputValue(key, value) — atualiza input + limpa erro do campo
  // calculate() → {
  //   1. parseNumber para cada input
  //   2. Zod validation
  //   3. Se erro → fieldErrors
  //   4. Se OK → calculateFn → formatToUserView → setResult
  //   5. onSuccess (salvar histórico, etc.)
  // }
  // clear() — reseta tudo
}
```

### 10.3 Composição de Telas

```
IPUScreen / CalibrationScreen
├── ScreenLayout (header + footer)
├── Card
│   └── VStack
│       └── Input (para cada campo)
├── Button "Calcular"
├── Button "Limpar"
├── Button "Salvar como Modelo"
└── ResultCard (condicional)

ModelsScreen
├── ScreenLayout (header + footer)
├── Input (busca)
├── ModelList (ipu)
│   └── ModelCard (para cada modelo)
├── ModelList (calibration)
│   └── ModelCard (para cada modelo)
├── ModelFormModal (criação/edição)
└── ModelDeleteModal (confirmação)
```

### 10.4 Provedores e Contextos

```
RootLayout
└── PWAInstallProvider
    └── AppContent
        ├── AuthProvider
        │   └── TranslationProvider
        │       └── ToastProvider
        │           └── ErrorBoundary
        │               ├── Stack (rotas)
        │               ├── NavMenu (global)
        │               ├── UpdateBanner
        │               └── DebugPanel
```

---

## 11. Integração com Supabase

### 11.1 Arquitetura de Comunicação

```
APP (Frontend)
    │
    ├── Supabase Auth API (direto para login/logout)
    │   POST /auth/v1/token
    │   POST /auth/v1/logout
    │   GET /auth/v1/user
    │
    ├── Edge Functions (via edgeFunctionsClient)
    │   POST /auth-login
    │   POST /auth-logout
    │   GET  /auth-validate
    │   GET  /models-get
    │   POST /models-sync
    │   DELETE /models-delete
    │   GET  /admin-users
    │   POST /admin-users
    │   PATCH /admin-users-update
    │   DELETE /admin-users-delete
    │   GET  /admin-logs
    │   GET  /admin-metrics
    │
    └── Supabase Realtime (WebSocket)
        subscribe('realtime-models')
```

### 11.2 Edge Functions — Shared Helpers

#### `_shared/authMiddleware.ts` — requireAuth

```typescript
// Valida JWT, verifica active + role mínimo
export async function requireAuth(req: Request, minRole: Role = 'viewer') {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) throw new AuthError('UNAUTHORIZED', 401);

  // Valida token via REST API (fetch direto, não SDK)
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
  });
  if (!userRes.ok) throw new AuthError('UNAUTHORIZED', 401);

  // Busca profile via REST API
  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=role,active,name`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );
  const profiles = await profileRes.json();
  const profile = profiles?.[0];

  if (!profile) throw new AuthError('UNAUTHORIZED', 401);
  if (!profile.active) throw new AuthError('ACCOUNT_SUSPENDED', 403);
  if (roleIndex < minRoleIndex) throw new AuthError('FORBIDDEN', 403);

  return { user, profile };
}
```

**Por que fetch direto e não SDK?** O SDK do Supabase para Deno tem problemas com RLS quando usa SERVICE_ROLE_KEY. Fetch direto com `apikey: serviceKey` + `Authorization: Bearer serviceKey` bypassa RLS corretamente.

#### `_shared/cors.ts` — CORS Dinâmico

```typescript
const PROD_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://ipu-calculator.vercel.app';
const STAGING_ORIGIN = Deno.env.get('ALLOWED_ORIGIN_STAGING') ?? 'https://ipu-calculator-staging.vercel.app';
const validOrigins = [PROD_ORIGIN, STAGING_ORIGIN];
const isDev = Deno.env.get('DENO_DEPLOYMENT_ID') === undefined; // auto-detecção local

export function handleCors(req: Request): Response | null {
  const origin = req.headers.get('origin') ?? '';
  if (req.method === 'OPTIONS') {
    // Permite localhost (desenvolvimento)
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) { ... }
    // Permite *.vercel.app (preview branches, staging, production)
    if (origin.endsWith('.vercel.app')) { ... }
    // Produção: permite apenas origens configuradas
    const allowed = validOrigins.includes(origin) ? origin : validOrigins[0];
    return new Response(null, { status: 200, headers: { ... } });
  }
  return null;
}

// Para respostas não-OPTIONS: determina o Origin dinamicamente
export function getCorsHeaders(origin?: string | null) { ... }
```

**Características:**
- `DENO_DEPLOYMENT_ID` ausente → auto-detecção de ambiente local (dev)
- `ALLOWED_ORIGIN_STAGING` para staging separado da produção
- `getCorsHeaders()` para respostas não-OPTIONS (ex: erros 401/403 também precisam de CORS)
- Fallback: `validOrigins[0]` se origem não reconhecida

#### `_shared/auditLogger.ts` — Log de Auditoria

```typescript
// Fire-and-forget: falha no log nunca bloqueia resposta
export async function logAccess({ supabase, userId, action, resource, metadata, req }) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const platform = detectPlatform(userAgent);
  // INSERT em access_logs
}
```

### 11.3 Banco de Dados (Migrations)

#### Tabela `profiles`

```sql
CREATE TABLE public.profiles (
  id        uuid REFERENCES auth.users ON DELETE CASCADE,
  name      text NOT NULL,
  role      text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  active    boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_seen  timestamptz,
  PRIMARY KEY (id)
);
```

#### Tabela `access_logs`

```sql
CREATE TABLE public.access_logs (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users ON DELETE SET NULL,
  action     text NOT NULL,
  resource   text,
  metadata   jsonb,
  ip         text,
  platform   text,
  created_at timestamptz DEFAULT now()
);
```

#### RLS na tabela `models`

```sql
-- Leitura: todos autenticados e ativos
CREATE POLICY "models_select" ON models FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND active = true));

-- Escrita: somente editor e admin
CREATE POLICY "models_insert" ON models FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin') AND active = true));

CREATE POLICY "models_update" ON models FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin') AND active = true));

CREATE POLICY "models_delete" ON models FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin') AND active = true));
```

---

## 12. PWA e Service Worker

### 12.1 Service Worker Strategy

**Network-First** com fallback para cache:

```javascript
// service-worker.js
self.addEventListener('fetch', event => {
  // Ignora requisições Supabase
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)                    // Tenta rede primeiro
      .then(response => {
        if (response.status === 200) {       // Cacheia respostas OK
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request)    // Fallback para cache
          .then(cached => cached || caches.match('/index.html')); // SPA shell
      })
  );
});
```

### 12.2 Versionamento Automático do SW

```javascript
// Placeholder substituído em cada build
const CACHE_NAME = 'ipu-calc-__APP_VERSION__';
```

**Script de injeção** (`scripts/inject-sw-version.js`):
```
1. Lê dist/service-worker.js
2. Substitui __APP_VERSION__ por APP_VERSION real
3. Salva arquivo
```

**Executado após** `npm run build` (expo export).

### 12.3 Detecção de Instalação

```typescript
// usePWAInstall.tsx
// Usa sinais reais do navegador, nunca localStorage ou env vars:

const checkIsStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as any).standalone === true;

// beforeinstallprompt → canInstall = true
// Android sem prompt → fallback 5s timeout
// iOS → sempre mostra instruções manuais
// isDismissed flag → bloqueia reativação após dismiss
```

### 12.4 Estados do PWA Pill

| Estado | Condição | Ação |
|--------|----------|------|
| Instalar | `!isStandalone && canInstall` | Dispara prompt ou instruções |
| Atualizar | `isStandalone && updateAvailable` | Alerta "Feche e abra o app" |

### 12.5 Matriz de Comportamento por Ambiente

| Ambiente | Debug Button | Service Worker |
|----------|--------------|----------------|
| `npm start` (development) | ✅ aparece | ❌ não registra |
| staging | ✅ aparece | ✅ registra |
| production | ❌ não aparece | ✅ registra |

---

## 13. CI/CD e Automação

### 13.1 Workflows GitHub Actions

#### `ci.yml` — Validação

```yaml
name: CI

on:
  push:
    branches: [main, refactor]
  pull_request:
    branches: [main, develop, refactor]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]    # Matriz de ambientes

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build validation
        if: matrix.node-version == 20  # Node 18 não suporta metro-config
        run: npm run build
```

#### `bump.yml` — Versionamento Automático

```
On: push to develop (exceto commits com [skip ci])
1. Extrai versão do package.json
2. Incrementa patch (major/minor manual quando necessário)
3. Atualiza package.json, app.json e src/core/version.ts
4. Builda o projeto
5. Commit + push com [skip ci] (evita loop)
```

> **Nota:** O bump automático só executa para commits **sem** `[skip ci]` no subject. Isso previne loop infinito quando o próprio workflow faz push. A versão é gerenciada exclusivamente pelo CI — nunca manualmente.

#### `preview-comment.yml` — Preview Deploy

```yaml
on:
  deployment_status

permissions:
  issues: write
  pull-requests: write

jobs:
  comment:
    if: github.event.deployment_status.state == 'success' && github.event.deployment.environment == 'Preview'
    steps:
      - Usa actions/github-script@v7 para:
        a. Encontrar PR aberto para o ref do deploy
        b. Buscar URL do preview no deployment_status
        c. Criar ou atualizar comentário usando marker <!-- vercel-preview -->
```

**Detalhes:**
- Trigger: `deployment_status` (aguarda deploy da Vercel concluir)
- Permissions: `issues: write` + `pull-requests: write` (necessário para criar/editar comentários)
- Upsert: verifica se já existe comentário com o marker; se sim, atualiza; se não, cria novo

### 13.2 Estrutura de Branches

| Branch | Ambiente | Deploy |
|--------|----------|--------|
| `refactor` | Desenvolvimento local | — |
| `develop` | Staging (ipu-calculator-staging.vercel.app) | Automático |
| `main` | Produção (ipu-calculator.vercel.app) | Manual (merge) |

### 13.3 Fluxo de Release

```
1. refactor → implementação
2. PR refactor → develop
3. CI valida (lint + test + build)
4. Merge → develop → bump automático → staging
5. Testa em staging
6. PR develop → main
7. Merge → main → produção
```

### 13.4 Branch Protection

**Configurado via API do GitHub:**

| Branch | CI Obrigatório | PR Obrigatório | Approvals | [skip ci] Permitted |
|--------|---------------|----------------|-----------|---------------------|
| `main` | lint-and-test (18, 20) | Sim | 1 review | ❌ |
| `develop` | lint-and-test (18, 20) | Não | — | ✅ (bump automático) |

- **`main`**: strict mode, enforce admins, PR obrigatório com 1 review
- **`develop`**: CI obrigatório mas sem PR obrigatório — permite que o `bump.yml` faça push direto com `[skip ci]`

**Convenção `[skip ci]`:** O `bump.yml` (linha 9) verifica:
```yaml
if: ${{ !contains(github.event.head_commit.message, '[skip ci]') }}
```
Isso garante que o commit de bump (`chore: bump version [skip ci]`) não dispare o próprio bump novamente, evitando loop infinito.

### 13.5 Scripts Locais

```bash
npm run lint           # ESLint
npm test               # Jest (todos os testes)
npm run build          # Expo export + inject SW version
npm run build:preview  # Build + serve local

# Testes por módulo
npm run test:lint        # Design system
npm run test:core        # Core modules
npm run test:features    # Domain logic
npm run test:integration # Screens + hooks
npm run test:e2e         # Playwright
```

---

## 14. Testes

### 14.1 Pirâmide de Testes

```
         ┌──────────┐
         │   E2E    │  ← Playwright (5 specs)
         │ (fluuxos) │
        ┌┴──────────┴┐
        │ Integração  │  ← RNTL + Jest (screens + hooks)
        │ (wiring)   │
       ┌┴────────────┴┐
       │  Unitários    │  ← Jest (domínio + infra)
       │  (lógica)    │
       └──────────────┘
```

### 14.2 Estrutura de Testes

```
src/
├── features/ipu/domain/__tests__/
│   ├── calculateIPU.test.ts        # Cálculo com valores padrão, borda, zero
│   └── (ipuSchema.test.ts)         # Validação Zod
├── features/calibration/domain/__tests__/
│   ├── calculateCalibration.test.ts # Regra de três, divisão por zero
│   └── calibrationSchema.test.ts
├── features/models/__tests__/
│   ├── modelRepository.test.ts     # Cache corrompido → backup → restore
│   ├── schemaMigrationService.test.ts # Migração com dados reais
│   ├── lastWriteWins.test.ts       # Merge com version
│   └── useRealtimeModels.test.ts   # Subscribe/unsubscribe
├── features/models/infra/__tests__/
│   └── modelSyncService.test.ts
├── core/api/__tests__/
│   └── edgeFunctionsClient.test.ts
├── core/auth/__tests__/
│   └── AuthProvider.validation.test.ts
├── core/formatters/__tests__/
├── core/parsers/__tests__/
├── hooks/__tests__/
│   ├── useCalculatorLogic.test.ts
│   └── useRequireAuth.test.ts
├── design-system/__tests__/
│   ├── Button.test.tsx
│   ├── Card.test.tsx
│   ├── Input.test.tsx
│   └── Text.test.tsx
├── features/ipu/screens/IPUScreen.test.tsx
├── features/calibration/screens/CalibrationScreen.test.tsx
├── app/__tests__/login.test.tsx

e2e/
├── realtime-sync.spec.ts           # Sync entre abas
├── offline-sync.spec.ts            # Comportamento offline
├── rate-limiting.spec.ts           # Rate limit
├── security-flows.spec.ts          # Fluxos de segurança
├── edge-functions-integration.spec.ts
└── helpers/
    └── cleanup.ts                  # Limpeza automática de modelos E2E (prefixo E2E_SYNC_)
                                      - goToModels() com waitForFunction (polling DOM)
                                      - findE2EModelNames() via data-testid
                                      - deleteModelByName() via UI (clique + confirm)

supabase/functions/__tests__/
├── auth-login-rate-limit.test.ts
├── auth-login-authorization.test.ts
├── models-sync-authorization.test.ts
├── models-delete-authorization.test.ts
└── models-get-authorization.test.ts
```

### 14.3 Regras de Mock

- **AsyncStorage:** mock global via `jest.setup.js`
- **Supabase:** mock manual em `__mocks__/`
- **NetInfo:** mock via `jest.setup.js`
- **i18n:** mock global com mapa estático `ptLabels`
- **Nunca mockar funções de domínio** — elas são testadas reais

### 14.4 Testes de Domínio (Exemplo)

```typescript
// calculateIPU.test.ts
describe('calculateIPU', () => {
  it('retorna valor correto para inputs padrão', () => {
    const result = calculateIPU({ isocyanate: 0.0771, polyol: 0.1506 });
    expect(result).toBeCloseTo(1.6264, 4);
  });

  it('lança erro para isocianato zero', () => {
    expect(() => calculateIPU(0, 0.15)).toThrow();
  });
});
```

### 14.5 Limpeza de Dados E2E

Testes E2E no Playwright criam modelos reais no Supabase com prefixo `E2E_SYNC_`. O helper `e2e/helpers/cleanup.ts` remove esses modelos via UI (clique + confirm) nos hooks `beforeAll`/`afterAll` de cada spec.

**Mecanismo:**
- `goToModels(page)`: navega para `/models` e aguarda cards ou estado vazio via `waitForFunction` (polling DOM)
- `findE2EModelNames(page)`: localiza cards com `[data-testid^="model-card-E2E_SYNC_"]`
- `deleteModelByName(page, name)`: clica no último ícone (lixeira) e confirma no modal

**Bugfix conhecido:** Substituído `waitForTimeout(2000)` por `waitForFunction` — o timeout fixo perdia modelos porque a página não terminava de renderizar após autenticação + fetch remoto.

**Melhoria futura (backlog item 10.1):** Quando o app escalar, implementar limpeza via Edge Function com SERVICE_ROLE_KEY (bypassa UI), script CI dedicado, e cron job para remover registros expirados.

---

## 15. Sistema de Governança e IA

### 15.1 Filosofia de Governança

O projeto utiliza um sistema sofisticado de governança para desenvolvimento assistido por IA. A documentação em `docs/` não é apenas referência — é **código executável de contexto** que determina o comportamento do agente de IA.

### 15.2 Estrutura de Governança

```
docs/
├── AGENTS.md              ← Arquivo de agente (personalidade, regras, proibições)
├── roadmaps/              ← Visão macro e objetivos de longo prazo
├── plans/                 ← Planos de ação específicos
│   └── archive/           ← Planos concluídos (economia de tokens)
├── workflow/              ← Guias de padronização (branches, deploy, setup)
├── skill/                 ← Skills técnicas (protocolos de implementação)
├── adr/                   ← Architecture Decision Records (54 decisões)
├── plain/                 ← Planos de implementação (PWA, autenticação)
└── summary/               ← Resumos de sessões concluídas
```

### 15.3 AGENTS.md — O "Cérebro" do Agente

O arquivo `AGENTS.md` na raiz define:

1. **Identidade:** "Engenheiro de Software Sênior especializado em arquitetura limpa e refatoração"
2. **Fontes de Verdade:** Toda resposta deve ser baseada em `./docs/`
3. **Regras de Comportamento:**
   - Consulta silenciosa (não pede permissão para ler docs)
   - Priorização de planos (sempre verificar `docs/plans/`)
   - Validação de workflow
   - Respostas concisas
4. **Restrições de Operação:**
   - PROIBIDO commit de `.env`
   - PROIBIDO auto-commit
   - APENAS staging
   - Revisão primeiro

### 15.4 Protocolos (Skills)

Cada skill em `docs/skill/` é um protocolo que define **como** implementar algo:

| Skill | Propósito |
|-------|-----------|
| `principal_skill.md` | Base: feature-first, SRP, DRY, YAGNI, OCP, DIP |
| `sync_offline_architecture.md` | Arquitetura de sincronização |
| `schema_migration_protocol.md` | Migração de dados |
| `model_persistence_protocol.md` | Persistência atômica |
| `background_sync_orchestration.md` | Sync em background |
| `optimistic_ui_sync_indicators.md` | Indicadores de sync |
| `pwa_lifecycle_protocol.md` | Ciclo de vida PWA |
| `i18n_protocol.md` | Internacionalização |
| `testing_protocol.md` | Pirâmide de testes |
| `error_handling_observability.md` | Logging e erros |
| `authentication_protocol.md` | Autenticação |
| `rbac_protocol.md` | Controle de acesso |
| `edge_functions_protocol.md` | Padrão de Edge Functions |
| `admin_panel_protocol.md` | Painel administrativo |
| `security_threat_model.md` | Modelo de ameaças |
| `design_system_tokenization_protocol.md` | Tokens de design |
| `animation_protocol.md` | Animações |
| `network_connectivity_protocol.md` | Conectividade |
| `network_cors_protocol.md` | CORS |
| `documentation_as_code_protocol.md` | Documentação como código |
| `codebase_hygiene_protocol.md` | Higiene do repositório |
| `clean_code_architect.md` | Código limpo |
| `architectural_integrity_protocol.md` | Integridade arquitetural |
| `git_workflow.md` | Workflow Git |
| `cache_versioning_protocol.md` | Versionamento de cache |
| `resilient_error_handling.md` | Tratamento de erros |
| `i18n_integration_protocol.md` | Integração i18n |
| `page-title-standard.md` | Padronização de títulos |
| `side_navigation_design.md` | Design de navegação |
| `design-system-master.md` | Design system master |
| `testing_protocol.md` | Protocolo de testes |

### 15.5 Architecture Decision Records (ADRs)

O arquivo `docs/adr/README.md` documenta **54 decisões arquiteturais** no formato:

```
Contexto → Decisão → Alternativas → Justificativa
```

Exemplos de ADRs:
- **ADR-01:** Feature-first Architecture
- **ADR-08:** Mutex de Escrita (withWriteLock)
- **ADR-13:** Arquitetura de Sync em 4 Camadas
- **ADR-16:** Version Counter para Merge
- **ADR-22:** sessionStorage (Web) + SecureStore (Mobile)
- **ADR-43:** Flag isDismissed no PWA Pill
- **ADR-46:** Pirâmide de Testes em 4 Níveis

### 15.6 Como a IA é Orquestrada

1. **Setup:** `docs/workflow/setup-validation.md` define como validar o ambiente
2. **Plano:** Agente consulta `docs/plans/` para saber o que fazer
3. **Skill:** Para cada tarefa, carrega a skill relevante
4. **Implementação:** Código gerado seguindo os protocolos
5. **Verificação:** Testes, lint, build
6. **Documentação:** ADRs e plans atualizados

### 15.7 MCP e Controle de Contexto

O arquivo `opencode.json` configura:
- **Provedor:** OpenRouter/MiniMax (text-01)
- **Context Window:** 128k tokens
- **Glob:** `docs/**/*.md` para carregar automaticamente
- **Comandos personalizados:** `merge-to-develop`, `build-preview`, etc.

---

## 16. Segurança

### 16.1 Modelo de Ameaças

| ID | Ameaça | Mitigação |
|----|--------|-----------|
| T1 | ANON_KEY no bundle | Edige Functions como única camada de dados |
| T2 | Acesso não autorizado | RLS + requireAuth |
| T3 | Escalada de privilégio | Perfil validado no servidor a cada restore |
| T4 | Acesso admin por não-admin | useRequireAuth('admin') + requireAuth no servidor |
| T5 | Conta suspensa com sessão | requireAuth verifica active no banco |
| T6 | JWT roubado | sessionStorage (web) + SecureStore (mobile) + HTTPS |
| T7 | XSS no PWA | CSP + sessionStorage |
| T8 | CSRF | CORS restrito ao domínio |
| T9 | Enumeração de usuários | Login sempre retorna INVALID_CREDENTIALS |
| T10 | Admin auto-suspensão | Bloqueio no frontend e servidor |

### 16.2 Defesa em Profundidade

```
┌────────────────────────────────────────────┐
│               Frontend                      │
│  - sessionStorage (web)                     │
│  - SecureStore (mobile)                     │
│  - useRequireAuth                           │
│  - usePermissions (UI adaptation)           │
└──────────────────┬─────────────────────────┘
                   │
┌──────────────────▼─────────────────────────┐
│            Edge Functions                   │
│  - requireAuth (JWT + role + active check)  │
│  - SERVICE_ROLE_KEY (server only)           │
│  - CORS restricted                          │
│  - Rate limiting (5/60s login)              │
│  - Audit logging (fire-and-forget)          │
└──────────────────┬─────────────────────────┘
                   │
┌──────────────────▼─────────────────────────┐
│               Supabase DB                   │
│  - RLS (Row Level Security)                  │
│  - Custom Claims (role in JWT)              │
│  - CHECK constraints                        │
│  - Índices para performance                 │
└────────────────────────────────────────────┘
```

### 16.3 Fluxo de Segurança

```
REQUISIÇÃO A UMA EDGE FUNCTION:

1. CORS: OPTIONS preflight → verifica origin
2. requireAuth():
   a. Extrai Bearer token do header
   b. Valida token: fetch SUPABASE_URL/auth/v1/user
   c. Busca profile: fetch profiles?id=eq.{userId}
   d. Verifica active === true
   e. Verifica role >= minRole
3. Lógica de negócio
4. logAccess() (fire-and-forget)
5. Resposta padronizada (ok/err)
```

### 16.4 Tratamento de Erros de Segurança

```typescript
// Erros específicos, nunca stack trace:
UNAUTHORIZED (401) → "Credenciais inválidas"
FORBIDDEN (403) → "Acesso negado"
ACCOUNT_SUSPENDED (403) → "Conta suspensa"
INVALID_CREDENTIALS (401) → "E-mail ou senha inválidos"
INTERNAL_ERROR (500) → "Erro interno. Tente novamente."
```

---

## 17. Explicação Arquivo por Arquivo

### 17.1 `src/core/config.ts`

**Responsabilidade:** Ponto central de configuração do ambiente. Todas as variáveis de ambiente expostas ao cliente são acessadas aqui.

```typescript
export const CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL
    ?? 'https://uqihnpwpcrujqycbuzxv.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  EDGE_FUNCTIONS_URL: process.env.EXPO_PUBLIC_EDGE_FUNCTIONS_URL
    ?? 'https://uqihnpwpcrujqycbuzxv.supabase.co/functions/v1',
} as const;
```

**Decisão arquitetural:** Centralizar configurações evita espalhar `process.env.*` pelo código. O `as const` garante que os valores sejam literais imutáveis no tipo.

### 17.2 `src/core/storage/asyncStorageClient.ts`

**Responsabilidade:** Abstração genérica sobre AsyncStorage com serialização JSON.

```typescript
export const asyncStorageClient = {
  async get<T>(key: StorageKey): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  async set<T>(key: StorageKey, value: T): Promise<boolean> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  },
  async remove(key: StorageKey): Promise<boolean> { ... },
  async clear(): Promise<boolean> { ... },
};
```

**Decisão arquitetural:** Usar `StorageKey` tipado (const) evita erros de digitação nas chaves. Todos os acessos ao AsyncStorage devem passar por este cliente — nunca `AsyncStorage.getItem()` direto.

### 17.3 `src/core/storage/storageKeys.ts`

```typescript
export const STORAGE_KEYS = {
  CALCULATION_HISTORY: '@ipu:history',
  MODELS: '@ipu:models',
  PENDING_DELETES: '@ipu:pending_deletes',
  PENDING_EDITS: '@ipu:pending_edits',
  SCHEMA_VERSION: '@ipu:schema_version',
  CACHE_VERSION: '@ipu:cache_version',
  DEVICE_ID: '@ipu:device_id',
  MODELS_BACKUP: '@ipu:models_backup',
  // ...
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
```

**Padrão:** Todas as chaves usam prefixo `@ipu:` para evitar conflitos com outras apps no mesmo dispositivo. O tipo `StorageKey` é derivado automaticamente do objeto const.

### 17.4 `src/core/versioning/cacheVersion.ts`

```typescript
export const CACHE_VERSION = {
  SCHEMA: '2.2.0',         // Versão do schema de dados
  SW: APP_VERSION,          // Versão do Service Worker
  MODEL_TTL_MS: 48 * 60 * 60 * 1000,  // 48h TTL
} as const;
```

**Importância:** Toda mudança na interface `CalculationModel` requer incremento de `SCHEMA`. O `schemaMigrationService` compara essa constante com a versão salva para decidir se precisa migrar.

### 17.5 `src/core/auth/AuthProvider.tsx`

**Responsabilidade:** Gerenciar o ciclo de vida da autenticação: restaurar sessão, login, logout.

**Fluxo detalhado:**

```typescript
// 1. RESTAURAÇÃO DE SESSÃO
useEffect(async () => {
  // Lê token e profile do storage
  const [storedToken, storedProfileRaw] = await Promise.all([
    sessionStorage.getToken(),
    sessionStorage.getProfile(),
  ]);

  if (storedToken && storedProfileRaw) {
    // Tenta validar com servidor (com timeout de 3s)
    const res = await fetchWithTimeout(`${SUPABASE_URL}/auth/v1/user`, 3000);
    if (res.ok) {
      const userData = await res.json();
      const freshProfile = await fetchProfile(storedToken, userData.id);
      setSession({ access_token: storedToken });
      setUser({ id: userData.id, role: freshProfile.role });
      setProfile(freshProfile);
    } else {
      await sessionStorage.clearAll(); // Token inválido
    }
  }
  setIsLoading(false);
}, []);

// 2. LOGIN
const signIn = async (email, password) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: CONFIG.SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });

  const { access_token, user: userData } = await res.json();
  const profile = await fetchProfile(access_token, userData.id);

  await Promise.all([
    sessionStorage.setToken(access_token),
    sessionStorage.setProfile(JSON.stringify(profile)),
  ]);

  setSession({ access_token });
  setUser({ id: userData.id, role: profile.role });
  setProfile(profile);
};
```

**Decisões arquiteturais:**
- Login usa Supabase Auth REST API diretamente (não Edge Function) por simplicidade
- `fetchProfile` tem 3 níveis de fallback: REST API → Edge Function → default viewer
- Timeout de 3s previne travamento em redes lentas/offline

### 17.6 `src/core/api/edgeFunctionsClient.ts`

**Responsabilidade:** Cliente centralizado para todas as chamadas a Edge Functions.

```typescript
async function fetchWithAuth<T>(endpoint, options) {
  const token = await getAuthToken();
  
  // Se não tem token, retorna erro específico
  if (!token) return { ok: false, error: 'NO_TOKEN_AVAILABLE' };

  // Timeout de 3500ms
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal });
    // Logs detalhados para debug
    return { ok: true, data };
  } catch (e) {
    // Diferencia TIMEOUT de NETWORK_ERROR
    const isTimeout = error.name === 'AbortError';
    return { ok: false, error: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR' };
  }
}
```

**Métodos expostos:**
- `syncModel()` — POST /models-sync
- `deleteModel()` — DELETE /models-delete
- `getModels()` — GET /models-get
- `validateSession()` — GET /auth-validate
- `getAdminUsers()` — GET /admin-users
- `createAdminUser()` — POST /admin-users
- `updateAdminUser()` — PATCH /admin-users-update

### 17.7 `src/features/models/infra/modelRepository.ts`

**O coração da persistência.** Contém:
- `withWriteLock` — mutex para escrita atômica
- `getAll()` — leitura com stale-while-revalidate + 3 níveis de recovery
- `create()` — criação com optimistic UI + background sync
- `update()` — atualização com version increment + pending edits
- `delete()` — remoção com pending deletes
- `createFromRemote()` — inserção de eventos Realtime (sem mutex)
- `subscribe()` — observer pattern para UI

**Destaque:** `getAll()` implementa recovery em cascata:
```
cache corrompido → tenta backup → backup falha → limpa + refresh remoto → []
```

### 17.8 `src/features/models/application/fetchRemoteModelsUseCase.ts`

**Responsabilidade:** Buscar modelos do servidor e fazer merge com cache local.

```typescript
export const fetchRemoteModelsUseCase = async () => {
  const data = await edgeFunctionsClient.getModels();
  const localModels = await modelRepository.getAll();

  // Merge: version decide, updatedAt desempata
  for (const rm of remoteModels) {
    if (localIndex >= 0) {
      const remoteNewer = rm.version > local.version ||
        (rm.version === local.version && rm.updatedAt > local.updatedAt);
      if (remoteNewer) updated[localIndex] = rm;
    } else {
      updated.push(rm);
    }
  }

  // Filtro: mantém pending + remotos, remove synced que não existem mais
  const remoteIds = new Set(data.map(m => m.id));
  const filtered = updated.filter(m =>
    m.syncStatus === 'pending' || remoteIds.has(m.id)
  );

  await modelRepository.saveWithLock(filtered);
};
```

### 17.9 `src/hooks/useNetworkStatus.ts`

**Responsabilidade:** Detecção híbrida de conectividade.

```typescript
// Web:
1. navigator.onLine como dica inicial
2. fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' })
   Timeout: 3s → confirma conectividade real
3. Heartbeat: verifica a cada 10s
4. Eventos: online/offline

// Mobile:
1. NetInfo.fetch() inicial
2. NetInfo.addEventListener com debounce de 500ms
```

**Decisão:** `navigator.onLine` sozinho não é confiável (captive portals, WiFi sem internet). O heartbeat confirma conectividade real.

### 17.10 `src/hooks/useSyncEngine.ts`

**Responsabilidade:** Inicializar e coordenar a sincronização.

```typescript
export const useSyncEngine = () => {
  const isConnected = useNetworkStatus();

  useEffect(() => {
    // Inicialização (uma vez)
    if (isConnected === true) {
      schemaMigrationService.migrateIfNeeded();
      runSync();
    }
  }, [isConnected]);

  useEffect(() => {
    // Reconexão
    if (prevConnected === false && isConnected === true) {
      runSync();
    }
  }, [isConnected]);
};
```

**Flag `isFirstRun`:** Implementada via `isInitialized` ref para evitar que o listener de reconexão dispare sync duplicado durante o init.

### 17.11 `src/features/models/hooks/useRealtimeModels.ts`

**Responsabilidade:** Hook que gerencia o estado dos modelos na UI.

```typescript
export const useRealtimeModels = () => {
  const { isLoading: authLoading, user, profile } = useAuth();

  const fetchModels = useCallback(async (fromRemote = false) => {
    // Aguarda AuthProvider terminar
    if (authLoading) return;

    if (fromRemote && user) {
      await fetchRemoteModelsUseCase();
    }

    const data = await modelRepository.getAll();
    setModels(data);
    setIsLoading(false);
  }, [authLoading, user, profile]);

  // Efeito principal
  useEffect(() => {
    if (authLoading) return;
    if (!user) fetchModels(false);  // só cache local
    else fetchModels(true);          // sync remoto

    // Subscribe a mudanças locais
    const unsubscribeRepo = modelRepository.subscribe(() => fetchModels(false));

    // Subscribe a mudanças remotas (Realtime)
    const channel = supabase.channel('realtime-models');
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'models' },
      () => fetchModels(true));
    channel.subscribe();

    return () => {
      unsubscribeRepo();
      supabase.removeChannel(channel);
    };
  }, [authLoading, user, profile, fetchModels]);
};
```

### 17.12 `public/service-worker.js`

**Estratégia:** Network-First com fallback para cache.

```javascript
// Características:
1. Cache versionado: 'ipu-calc-__APP_VERSION__' (substituído no build)
2. Network-First: tenta rede, cacheia resposta OK, fallback para cache
3. Ignora requisições Supabase (não interferir na API)
4. SPA shell: fallback final para /index.html
5. Sem auto-skipWaiting: nova versão aguarda ação do usuário
6. activate: limpa caches antigos + notifica clientes
```

### 17.13 `supabase/functions/auth-login/index.ts`

```typescript
// 1. CORS preflight
// 2. Valida método POST
// 3. Extrai email + password do body
// 4. Autentica via supabase.auth.signInWithPassword()
// 5. Busca profile via fetch direto (bypass RLS)
// 6. Se profile não existe → cria (primeiro login)
// 7. Se inactive → 403 ACCOUNT_SUSPENDED
// 8. Retorna { session, profile }
```

### 17.14 `src/hooks/useCalculatorLogic.ts`

**Hook genérico de cálculo.** Gerencia:
- Estado dos inputs (`Record<T, string>`)
- Validação Zod (se configurada)
- Cálculo via função pura
- Formatação do resultado
- Erros por campo e global
- Reset

```typescript
const config: CalculatorConfig<'isocyanate' | 'polyol'> = {
  inputs: ['isocyanate', 'polyol'],
  calculateFn: (iso, poly) => calculateIPU(iso, poly),
  validationSchema: ipuSchema,
};

const { inputs, setInputValue, result, error, fieldErrors, calculate, clear }
  = useCalculatorLogic(config);
```

### 17.15 `src/components/NavMenu.tsx`

**Menu hamburger lateral.** Implementação customizada com:
- `Animated.View` com `translateX` (não usa Modal)
- Scrim com opacidade animada
- `usePathname` para detectar rota ativa
- Destaque visual no item ativo (cor primária + fundo)
- Info do usuário (nome + role)
- Navegação: Home, Injeção, Calibração, Modelos
- Painel Admin (condicional, apenas admin)
- Logout
- Versão do app

### 17.16 `src/i18n/translations.ts`

**Fonte única de todas as strings.** Suporte a `pt` e `en` com paridade garantida por TypeScript (o tipo é derivado das chaves de `pt`).

```typescript
export const translations = {
  pt: {
    calculateInjection: 'Calcular Injeção',
    calibrateFlow: 'Calibrar Vazão',
    // ...
  },
  en: {
    calculateInjection: 'Calculate Injection',
    calibrateFlow: 'Calibrate Flow',
    // ...
  },
};
```

---

## 18. Decisões Arquiteturais

### 18.1 Por que Feature-First?

**Problema:** Código organizado por tipo (screens/, hooks/, services/) dificulta localizar código relacionado a uma funcionalidade.

**Decisão:** Cada feature (ipu, calibration, models) é uma pasta autossuficiente com seu domínio, use cases, infraestrutura e UI.

**Vantagens:**
- Isolamento: mudar uma feature não afeta outras
- Testabilidade: cada feature pode ser testada isoladamente
- Coesão: código relacionado fica próximo

### 18.2 Por que Optimistic UI?

**Problema:** Aguardar o servidor para refletir mudanças na UI causa latência perceptível.

**Decisão:** Escrever no cache local primeiro e sincronizar em background.

**Trade-off:** Possibilidade de conflitos se o servidor rejeitar (resolvido com badges "pending" + tentativas automáticas).

### 18.3 Por que Mutex de Escrita?

**Problema:** AsyncStorage não é transacional. Duas operações "ler → modificar → salvar" concorrentes causam perda de dados.

**Decisão:** Fila de promessas que serializa escritas.

**Custo:** Leve overhead de latência em operações simultâneas.

### 18.4 Por que Service Worker Network-First?

**Problema:** Cache-first servia versões antigas após deploy, causando erro 403.

**Decisão:** Network-first: sempre tenta rede primeiro, cache é fallback offline.

**Trade-off:** Requer conectividade para conteúdo novo, mas garante versão mais recente.

### 18.5 Por que sessionStorage em vez de localStorage?

**Problema:** localStorage persiste indefinidamente e é acessível por scripts XSS.

**Decisão:** sessionStorage no web — token some ao fechar a aba. SecureStore no mobile — criptografado.

**Trade-off:** Usuário precisa logar novamente ao reabrir o navegador (aceitável para app controlado).

### 18.6 Por que Edge Functions em vez de chamadas Supabase direto?

**Problema:** ANON_KEY exposta no bundle permite acesso direto ao banco.

**Decisão:** Toda comunicação passa por Edge Functions com SERVICE_ROLE_KEY (servidor).

**Custo:** Latência adicional de uma camada + deploy de funções.

### 18.7 Por que Version + Timestamp para merge?

**Problema:** Dois dispositivos editando offline podiam ter o mesmo `updatedAt`.

**Decisão:** `version` como critério primário, `updatedAt` como desempate.

**Alternativa descartada:** CRDT (complexo demais para o caso de uso atual — YAGNI).

### 18.8 Por que Recovery em 3 níveis?

**Problema:** Cache corrompido poderia perder todos os modelos do usuário.

**Decisão:**
1. Cache → tenta ler normalmente
2. Se falha → restaura do backup
3. Se backup falha → limpa + refresh remoto

**Filosofia:** "Um backup não é um backup até que seja testado em recovery."

---

> **Fim do Guia Técnico Completo — IPU Calculator v1.2.9**  
> Documento gerado em 2026-05-26.  
> Próxima atualização: conforme evolução do projeto.
