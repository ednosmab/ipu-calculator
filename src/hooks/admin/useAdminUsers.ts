// src/hooks/admin/useAdminUsers.ts
// Gestão de usuários do painel admin

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

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
      const response = await fetch(`/admin/users`, {
        headers: {
          'Authorization': `Bearer ${authUser.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data: UserRow[] = await response.json();
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
      const response = await fetch(`/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authUser.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      await fetchUsers(); // Re-fetch após criação
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, [authUser]);

  const updateUser = useCallback(async (id: string, data: Partial<{
    role: 'viewer' | 'editor' | 'admin';
    active: boolean;
  }>) => {
    if (!authUser) return;
    
    // Prevent self-suspension
    if (id === authUser.id && data.active === false) {
      throw new Error('Cannot suspend yourself');
    }
    
    try {
      const response = await fetch(`/admin-users-update`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authUser.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      await fetchUsers(); // Re-fetch após atualização
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, [authUser]);

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
    refetch: fetchUsers 
  };
}