// src/hooks/admin/useAdminMetrics.ts
// Métricas do painel admin (via access_logs, sem usage_metrics)

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface MetricsData {
  activeUsersToday: number;
  activeUsers30Days: number;
  totalModels: number;
  totalUsers: number;
  loginsPerDay: Array<{ day: string; logins: number }>;
}

export function useAdminMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (!authUser) return;

    setIsLoading(true);
    setError(null);

    fetch(`/admin/metrics`, {
      headers: {
        'Authorization': `Bearer ${authUser.session?.access_token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        return response.json();
      })
      .then((data) => {
        setMetrics({
          activeUsersToday: data.summary?.activesToday ?? 0,
          activeUsers30Days: data.summary?.active30Days ?? 0,
          totalModels: data.summary?.totalModels ?? 0,
          totalUsers: data.summary?.totalUsers ?? 0,
          loginsPerDay: data.loginsByDay ?? [],
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('[Admin] Error fetching metrics:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [authUser]);

  const refetch = () => {
    if (!authUser) return Promise.resolve();
    setIsLoading(true);
    return fetch(`/admin/metrics`, {
      headers: {
        'Authorization': `Bearer ${authUser.session?.access_token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch metrics');
        return response.json();
      })
      .then((data) => {
        setMetrics({
          activeUsersToday: data.summary?.activesToday ?? 0,
          activeUsers30Days: data.summary?.active30Days ?? 0,
          totalModels: data.summary?.totalModels ?? 0,
          totalUsers: data.summary?.totalUsers ?? 0,
          loginsPerDay: data.loginsByDay ?? [],
        });
      })
      .finally(() => setIsLoading(false));
  };

  return { metrics, isLoading, error, refetch };
}