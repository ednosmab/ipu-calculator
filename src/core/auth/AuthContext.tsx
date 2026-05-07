// src/core/auth/AuthContext.tsx
// Contexto global de autenticação — único ponto de verdade sobre o estado do usuário

import { createContext } from 'react';

export type Role = 'viewer' | 'editor' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  role: Role;
  active: boolean;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

export interface AuthContextValue {
  /** Dados do usuário autenticado, null se não logado */
  user: { id: string; email?: string } | null;
  /** Perfil com role e status */
  profile: UserProfile | null;
  /** Sessão com access_token para chamadas às Edge Functions */
  session: AuthSession | null;
  /** true enquanto a sessão está sendo restaurada do storage */
  isLoading: boolean;
  /** Realiza login via Edge Function /auth-login */
  signIn: (email: string, password: string) => Promise<void>;
  /** Realiza logout via Edge Function /auth-logout e limpa storage */
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});
