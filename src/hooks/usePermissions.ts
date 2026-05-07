// src/hooks/usePermissions.ts
// Centraliza a lógica de UI por role — nunca confiar no cliente para acesso real

import { useAuth } from './useAuth';
import { Role } from '@/core/auth/AuthContext';

const ROLE_HIERARCHY: Role[] = ['viewer', 'editor', 'admin'];

function hasRole(userRole: Role | undefined, minRole: Role): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minRole);
}

/**
 * Retorna flags de permissão para adaptar a UI por role.
 * A validação real acontece no servidor — isso só adapta aparência.
 */
export function usePermissions() {
  const { profile } = useAuth();
  const role = profile?.role;

  return {
    canReadModels:  hasRole(role, 'viewer'),
    canWriteModels: hasRole(role, 'editor'),
    canAccessAdmin: hasRole(role, 'admin'),
  };
}
