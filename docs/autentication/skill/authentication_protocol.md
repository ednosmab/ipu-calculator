# SKILL: Authentication Protocol

Este protocolo define como autenticação e sessão devem ser implementados no IPU Calculator, cobrindo nativo (iOS/Android) e web (PWA).

---

## 🔐 Fluxo de Autenticação

A autenticação é obrigatória apenas para acessar a tela de Modelos. A calculadora é sempre livre.

```
Usuário tenta acessar /models
  → useRequireAuth detecta ausência de sessão
  → exibe modal de login
  → usuário envia email + senha
  → Edge Function valida e retorna JWT
  → JWT salvo no SecureStore (nativo) ou sessionStorage (web)
  → sessão restaurada no AuthContext
  → /models renderiza conforme o role
```

---

## 🧩 AuthContext

O contexto global de autenticação deve ser o único ponto de verdade sobre o estado do usuário.

```typescript
interface AuthContextValue {
  user: User | null;
  profile: Profile | null; // { role, active, name }
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

**Regras:**
- Nunca armazenar role ou permissões em estado local de componente — sempre consumir do AuthContext
- Nunca confiar em dados de role vindos do cliente — sempre validar no servidor
- Expor `isLoading` para evitar flash de conteúdo protegido antes da sessão ser restaurada

---

## 💾 Persistência de Sessão por Plataforma

```typescript
// core/auth/sessionStorage.ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'ipu_session';

export const sessionStorage = {
  async get(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return window.sessionStorage.getItem(SESSION_KEY);
    }
    return SecureStore.getItemAsync(SESSION_KEY);
  },

  async set(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      window.sessionStorage.setItem(SESSION_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(SESSION_KEY, token);
  },

  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      window.sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }
};
```

**Por que sessionStorage no web e não localStorage?**
- `localStorage` persiste indefinidamente e é acessível por scripts XSS
- `sessionStorage` some ao fechar a aba — o usuário precisa logar novamente, o que é aceitável dado o contexto controlado de acesso

---

## 🛡️ Hook de Proteção de Rota

```typescript
// hooks/useRequireAuth.ts
const ROLE_HIERARCHY = ['viewer', 'editor', 'admin'];

export function useRequireAuth(minRole: string = 'viewer') {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!profile?.active) {
      router.replace('/suspended');
      return;
    }

    const userRoleIndex = ROLE_HIERARCHY.indexOf(profile.role);
    const minRoleIndex = ROLE_HIERARCHY.indexOf(minRole);

    if (userRoleIndex < minRoleIndex) {
      router.replace('/unauthorized');
    }
  }, [user, profile, isLoading]);

  return { isAuthorized: !!user && !!profile?.active };
}
```

---

## ⚠️ Regras de Ouro

1. **Nunca renderizar conteúdo protegido antes de `isLoading === false`** — use um skeleton ou splash enquanto a sessão é restaurada
2. **Toda validação de role acontece no servidor** — o frontend apenas adapta a UI, nunca controla acesso real
3. **Logout deve limpar o storage local e invalidar a sessão no servidor** — nunca apenas limpar o estado em memória
4. **Erros de autenticação devem ser tratados explicitamente**: credenciais inválidas, conta suspensa e sessão expirada têm mensagens distintas para o usuário
5. **Nunca logar tokens ou senhas** — usar prefixo `[Auth]` nos logs e omitir dados sensíveis

---

## 📋 Checklist de implementação

- [ ] AuthContext implementado e envolve o app inteiro
- [ ] sessionStorage adapter cobre nativo e web
- [ ] useRequireAuth aplicado em /models e /admin
- [ ] Flash de conteúdo protegido eliminado com isLoading
- [ ] Logout limpa storage e invalida sessão no Supabase
- [ ] Mensagens de erro distintas por tipo de falha
- [ ] Nenhum dado de role confiado do cliente sem validação no servidor
