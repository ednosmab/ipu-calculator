// src/hooks/admin/useAdminUsers.ts
// Gestão de usuários do painel admin

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CONFIG } from '@/core/config';
import { edgeFunctionsClient } from '@/core/api/edgeFunctionsClient';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  active: boolean;
  last_seen: string | null;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: authUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    if (!authUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await edgeFunctionsClient.getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('[Admin] Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);
  const createUser = useCallback(async (data: {
    name: string;
    email: string;
    password: string;
    role: 'viewer' | 'editor' | 'admin';
  }) => {
    if (!authUser) return;
    
    try {
      const success = await edgeFunctionsClient.createAdminUser(data);
      if (!success) {
        throw new Error('Failed to create user');
      }
      await fetchUsers();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, [authUser, fetchUsers]);

  const updateUser = useCallback(async (id: string, data: Partial<{
    role: 'viewer' | 'editor' | 'admin';
    active: boolean;
  }>) => {
    if (!authUser) return;
    
    if (id === authUser.id && data.active === false) {
      throw new Error('Cannot suspend yourself');
    }
    
    try {
      const success = await edgeFunctionsClient.updateAdminUser({ id, ...data });
      if (!success) {
        throw new Error('Failed to update user');
      }
      await fetchUsers();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, [authUser, fetchUsers]);

  const deleteUser = useCallback(async (id: string) => {
    if (!authUser) return;
    
    if (id === authUser.id) {
      throw new Error('Cannot delete yourself');
    }
    
    try {
      const success = await edgeFunctionsClient.deleteAdminUser(id);
      if (!success) {
        throw new Error('Failed to delete user');
      }
      await fetchUsers();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, [authUser, fetchUsers]);

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { 
    users, 
    isLoading, 
    error, 
    createUser, 
    updateUser, 
    deleteUser,
    refetch: fetchUsers 
  };
}