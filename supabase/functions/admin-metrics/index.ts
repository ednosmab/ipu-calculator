// supabase/functions/admin-metrics/index.ts
// GET /admin-metrics — métricas do painel admin (sem uso de uso_metrics)

import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { requireAuth, AuthError } from '../_shared/authMiddleware.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') return err('METHOD_NOT_ALLOWED', 405);

  try {
    await requireAuth(req, 'admin');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString();

    // 1. Usuários ativos hoje
    const { count: activesToday } = await supabase
      .from('access_logs')
      .select('user_id', { count: 'exact', head: true })
      .eq('action', 'login')
      .gte('created_at', `${today}T00:00:00Z`);

    // 2. Usuários ativos nos últimos 30 dias (distinct)
    const { data: active30Raw } = await supabase
      .from('access_logs')
      .select('user_id')
      .eq('action', 'login')
      .gte('created_at', thirtyDaysAgo);

    const active30 = new Set(active30Raw?.map((r) => r.user_id)).size;

    // 3. Total de modelos cadastrados
    const { count: totalModels } = await supabase
      .from('models')
      .select('id', { count: 'exact', head: true });

    // 4. Total de usuários
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    // 5. Logins por dia — últimos 30 dias
    const { data: loginLogs } = await supabase
      .from('access_logs')
      .select('created_at')
      .eq('action', 'login')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at');

    const loginsByDay = buildLoginsByDay(loginLogs ?? []);

    return ok({
      summary: {
        activesToday: activesToday ?? 0,
        active30Days: active30,
        totalModels: totalModels ?? 0,
        totalUsers: totalUsers ?? 0,
      },
      loginsByDay,
    }, 200, req.headers.get('origin'));
  } catch (error) {
    if (error instanceof AuthError) return err(error.code, error.status);
    console.error('[admin-metrics] Erro inesperado:', error);
    return err('INTERNAL_ERROR', 500);
  }
});

function buildLoginsByDay(logs: { created_at: string }[]) {
  const map: Record<string, number> = {};
  for (const log of logs) {
    const day = log.created_at.split('T')[0];
    map[day] = (map[day] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([day, logins]) => ({ day, logins }))
    .sort((a, b) => a.day.localeCompare(b.day));
}