# Análise: Problema de Autenticação na Tela de Modelos

## 🔍 Problema Identificado

A tela que lista os modelos (`/models`) não está conseguindo passar na autenticação ao tentar buscar os modelos do servidor.

## 📊 Fluxo Atual

```
ModelsScreen (app/models.tsx)
  ↓
  useRequireAuth('viewer') — valida permissões
  ↓
  useRealtimeModels() — hook que busca modelos
    ↓
    fetchRemoteModelsUseCase()
      ↓
      edgeFunctionsClient.getModels()
        ↓
        fetchWithAuth() — obtém token e faz requisição
          ↓
          sessionStorage.getToken()
            ↓
            Platform.OS === 'web' 
              ? window.sessionStorage.getItem(SESSION_KEY)
              : SecureStore.getItemAsync(SESSION_KEY)
```

## ⚠️ Cenários de Falha Identificados

### 1. **Token Não Existe em `sessionStorage`**
**Onde:** `src/core/api/edgeFunctionsClient.ts` (linha 24)

```typescript
async function getAuthToken(): Promise<string | null> {
  return sessionStorage.getToken();
}
```

**Problema:** Se o token não estiver no storage (vazio, undefined, ou null), a função retorna `null` e nenhum header `Authorization` é enviado.

**Resultado:** A Edge Function `models-get` recebe requisição SEM header `Authorization` e retorna erro `UNAUTHORIZED` (401).

---

### 2. **Edge Function Rejeita Requisição Sem Token**
**Onde:** `supabase/functions/_shared/authMiddleware.ts` (linhas 35-36)

```typescript
const token = req.headers.get('Authorization')?.replace('Bearer ', '');
if (!token) throw new AuthError('UNAUTHORIZED', 401);
```

**Problema:** O middleware é obrigatório e valida ANTES de qualquer lógica de negócio.

**Resultado:** Requisição sem token é rejeitada imediatamente com erro 401.

---

### 3. **Tratamento Silencioso do Erro**
**Onde:** `src/features/models/application/fetchRemoteModelsUseCase.ts` (linhas 42-44)

```typescript
} catch (e) {
  // Offline or network error - keep local models
}
```

**Problema:** Erros de autenticação são engolidos. O usuário vê a tela carregando indefinidamente SEM saber que o token não foi enviado.

---

## 🔑 Causas Raiz

| Cenário | Causa |
|---------|-------|
| **Token não persiste** | `sessionStorage.setToken()` não foi chamado ou falhou durante login |
| **Web/Plataforma mismatch** | Platform detection errado em ambiente híbrido |
| **AuthProvider não finalizou** | `useRealtimeModels()` rodando antes de `AuthProvider` restaurar sessão |
| **Timeout sem feedback** | Usuário não sabe que falhou; vê Loading infinito |

---

## ✅ Solução Recomendada

### 1️⃣ **Adicionar Debug Logging**

```typescript
// src/core/api/edgeFunctionsClient.ts

async function fetchWithAuth<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<EdgeFunctionResponse<T>> {
  const token = await getAuthToken();
  
  console.log('[edgeFunctionsClient]', {
    endpoint,
    hasToken: !!token,
    tokenLength: token?.length,
    tokenPrefix: token?.substring(0, 20),
  });

  if (!token) {
    console.warn('[edgeFunctionsClient] ⚠️ Nenhum token disponível!');
  }

  // ... resto do código
}
```

---

### 2️⃣ **Validar Que AuthProvider Finalizou**

```typescript
// src/features/models/hooks/useRealtimeModels.ts

import { useAuth } from '@/hooks/useAuth';

export const useRealtimeModels = () => {
  const [models, setModels] = useState<CalculationModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isLoading: authLoading, user } = useAuth();

  const fetchModels = useCallback(async (fromRemote = false) => {
    // ✅ NOVO: Aguarda AuthProvider restaurar sessão
    if (authLoading) {
      console.log('[useRealtimeModels] Esperando AuthProvider finalizar...');
      return;
    }

    if (fromRemote) {
      const now = Date.now();
      if (now - lastSyncTime.current < 1000) {
        return;
      }
      lastSyncTime.current = now;
      
      // ✅ NOVO: Log se não há usuário
      if (!user) {
        console.warn('[useRealtimeModels] Sem user; ignorando sincronização remota');
        return;
      }
      
      await fetchRemoteModelsUseCase();
    }
    // ... resto
  }, [authLoading, user]);

  useEffect(() => {
    // ✅ NOVO: Só chama quando AuthProvider não está carregando
    if (!authLoading) {
      console.log('[useRealtimeModels] Inicializando...');
      fetchModels(true);
    }
  }, [authLoading, fetchModels]); // Adiciona authLoading como dependência
};
```

---

### 3️⃣ **Melhorar Tratamento de Erros**

```typescript
// src/features/models/application/fetchRemoteModelsUseCase.ts

export const fetchRemoteModelsUseCase = async (): Promise<void> => {
  try {
    const data = await edgeFunctionsClient.getModels();
    
    // ... resto do merge logic

  } catch (e: unknown) {
    const error = e as Error;
    
    // ✅ NOVO: Diferencia tipos de erro
    if (error.message.includes('UNAUTHORIZED') || 
        error.message.includes('401')) {
      console.error('[fetchRemoteModelsUseCase] ❌ Autenticação falhou!', error);
      // Opcional: Limpar token inválido
      // await sessionStorage.clearAll();
      // Router.replace('/login');
    } else if (error.message.includes('TIMEOUT')) {
      console.warn('[fetchRemoteModelsUseCase] ⏱️ Timeout na requisição');
    } else {
      console.warn('[fetchRemoteModelsUseCase] 🌐 Erro de rede:', error);
    }
  }
};
```

---

### 4️⃣ **Validar Token ao Iniciar App**

```typescript
// src/core/auth/AuthProvider.tsx

useEffect(() => {
  (async () => {
    try {
      const [storedToken, storedProfileRaw] = await Promise.all([
        sessionStorage.getToken(),
        sessionStorage.getProfile(),
      ]);

      // ✅ NOVO: Log de diagnóstico
      console.log('[AuthProvider] Sessão armazenada:', {
        hasToken: !!storedToken,
        hasProfile: !!storedProfileRaw,
      });

      if (storedToken && storedProfileRaw) {
        // Validação remota
        try {
          const res = await fetch(`${API_BASE}/auth-validate`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (res.ok) {
            const { profile: freshProfile } = await res.json();
            const parsedProfile: UserProfile = JSON.parse(storedProfileRaw);

            setSession({ access_token: storedToken });
            setUser({ id: freshProfile.id });
            setProfile(freshProfile);

            // ✅ NOVO: Log de sucesso
            console.log('[AuthProvider] ✅ Sessão restaurada com sucesso');
          } else {
            // ✅ NOVO: Log detalhado
            console.warn(`[AuthProvider] Servidor rejeitou token (${res.status})`);
            await sessionStorage.clearAll();
          }
        } catch (validateError) {
          console.warn('[AuthProvider] Falha na validação:', validateError);
          const storedProfile: UserProfile = JSON.parse(storedProfileRaw);
          setSession({ access_token: storedToken });
          setUser({ id: storedProfile.id });
          setProfile(storedProfile);
        }
      } else {
        // ✅ NOVO: Log se não há sessão
        console.log('[AuthProvider] Nenhuma sessão anterior encontrada');
      }
    } catch (e) {
      console.error('[AuthProvider] Falha crítica:', e);
    } finally {
      setIsLoading(false);
    }
  })();
}, []);
```

---

### 5️⃣ **Adicionar Retry Logic (Opcional)**

```typescript
// src/core/api/edgeFunctionsClient.ts

async function fetchWithAuth<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<EdgeFunctionResponse<T>> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!token) {
    return {
      ok: false,
      error: 'NO_TOKEN',
    };
  }

  headers['Authorization'] = `Bearer ${token}`;

  // ... resto do fetch
}
```

---

## 🧪 Checklist de Teste

- [ ] **Login:** Confirmar que `sessionStorage.setToken()` é chamado
- [ ] **Restore:** Recarregar app; verificar se token é restaurado
- [ ] **Modelos:** Acessar `/models` com usuário autenticado
- [ ] **Logs:** Abrir DevTools e verificar logs de `edgeFunctionsClient`
- [ ] **Edge Function:** Verificar header `Authorization` na requisição
- [ ] **Timeout:** Testar com conexão 3G (simular lentidão)
- [ ] **Offline:** Desativar rede e verificar fallback

---

## 📝 Resumo

| Item | Status | Ação |
|------|--------|------|
| Token não enviado | 🔴 Crítico | Adicionar logs no `fetchWithAuth()` |
| AuthProvider timing | 🟠 Alto | Adicionar `authLoading` check em `useRealtimeModels` |
| Erro silencioso | 🟠 Alto | Adicionar tratamento específico no `fetchRemoteModelsUseCase` |
| Sem feedback | 🟡 Médio | Adicionar toast de erro ou fallback UI |

---

## 🚀 Implementação Priorizada

1. **Imediato:** Adicionar logs (Solução #1)
2. **Curto prazo:** Validar timing AuthProvider (Solução #2)
3. **Médio prazo:** Melhorar tratamento de erros (Solução #3)
4. **Longo prazo:** Retry logic e UX (Solução #5)
