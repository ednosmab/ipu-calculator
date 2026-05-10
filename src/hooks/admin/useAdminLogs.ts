// src/hooks/admin/useAdminLogs.ts
// Logs de acesso do painel admin

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AccessLog {
  id: string;
  user_id: string | null;
  action: string;
  resource: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  platform: string | null;
  created_at: string;
}

interface LogFilters {
  userId?: string;
  actions?: string[];
  startDate?: string;
  endDate?: string;
  platform?: string;
}

export function useAdminLogs(filters: LogFilters = {}) {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: authUser } = useAuth();

  const fetchLogs = useCallback(async () => {
    if (!authUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query params
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.actions?.length) {
        filters.actions.forEach(action => params.append('actions', action));
      }
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.platform) params.append('platform', filters.platform);
      params.append('limit', '50'); // Paginação fixa de 50
      params.append('offset', (page * 50).toString());
      
      const response = await fetch(`/admin/logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authUser.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('[Admin] Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authUser, filters, page]);

  // Re-fetch quando filtros ou página mudam
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { 
    logs, 
    total, 
    page, 
    setPage, 
    isLoading, 
    error, 
    refetch: fetchLogs 
  };
}