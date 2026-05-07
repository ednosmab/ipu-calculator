// src/hooks/useAuth.ts
// Acesso tipado ao AuthContext — nunca use o contexto diretamente nos componentes

import { useContext } from 'react';
import { AuthContext, AuthContextValue } from '@/core/auth/AuthContext';

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
