// src/hooks/admin/useAdminMetrics.ts
// Métricas de uso do painel admin

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface MetricsData {
  activeUsersToday: number;
  activeUsers30Days: number;
  totalCalculations: number;
  totalModels: number;
  loginsPerDay: Array<{ day: string; logins: number }>;
  calculationsPerUser: Array<{ name: string; calculations: number }>;
  topModels: Array<{ modelId: string; name: string; uses: number }>;
}

export function useAdminMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: authUser } = useAuth();

  const fetchMetrics = useEffect(() => {
    if (!authUser) return;
    
    setIsLoading(true);
    setError(null);
    
    fetch(`/admin/metrics`, {
      headers: {
        'Authorization': `Bearer ${authUser.session?.access_token}`,
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      return response.json();
    })
    .then(data => {
      setMetrics(data);
    })
    .catch(err => {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('[Admin] Error fetching metrics:', err);
    })
    .finally(() => {
      setIsLoading(false);
    });
  }, [authUser]);

  // Refetch function
  const refetch = () => {
    fetchMetrics;
  };

  return { 
    metrics, 
    isLoading, 
    error, 
    refetch 
  };
}