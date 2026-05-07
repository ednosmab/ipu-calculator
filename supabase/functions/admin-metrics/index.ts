// supabase/functions/admin-metrics/index.ts
// GET /admin-metrics — agrega métricas de uso para o painel admin

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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

    // 2. Usuários ativos nos últimos 30 dias (distinct via RPC ou via query)
    const { data: active30Raw } = await supabase
      .from('access_logs')
      .select('user_id')
      .eq('action', 'login')
      .gte('created_at', thirtyDaysAgo);

    const active30 = new Set(active30Raw?.map((r) => r.user_id)).size;

    // 3. Total de cálculos
    const { count: totalCalculations } = await supabase
      .from('usage_metrics')
      .select('id', { count: 'exact', head: true })
      .eq('event', 'calculation_run');

    // 4. Total de modelos cadastrados
    const { count: totalModels } = await supabase
      .from('models')
      .select('id', { count: 'exact', head: true });

    // 5. Logins por dia — últimos 30 dias
    const { data: loginLogs } = await supabase
      .from('access_logs')
      .select('created_at')
      .eq('action', 'login')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at');

    const loginsByDay = buildLoginsByDay(loginLogs ?? []);

    // 6. Cálculos por usuário — top 10
    const { data: calcRaw } = await supabase
      .from('usage_metrics')
      .select('user_id, profiles(name)')
      .eq('event', 'calculation_run');

    const calcByUser = buildCalcByUser(calcRaw ?? []);

    // 7. Modelos mais selecionados — top 10
    const { data: modelRaw } = await supabase
      .from('usage_metrics')
      .select('metadata')
      .eq('event', 'model_selected');

    const topModels = buildTopModels(modelRaw ?? []);

    return ok({
      summary: {
        activesToday: activesToday ?? 0,
        active30Days: active30,
        totalCalculations: totalCalculations ?? 0,
        totalModels: totalModels ?? 0,
      },
      loginsByDay,
      calcByUser,
      topModels,
    });
  } catch (error) {
    if (error instanceof AuthError) return err(error.code, error.status);
    console.error('[admin-metrics] Erro inesperado:', error);
    return err('INTERNAL_ERROR', 500);
  }
});

// ── Helpers de agregação ─────────────────────────────────────

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

function buildCalcByUser(
  data: { user_id: string; profiles: { name: string } | null }[]
) {
  const map: Record<string, { name: string; calculations: number }> = {};
  for (const row of data) {
    const id = row.user_id;
    if (!map[id]) {
      map[id] = { name: row.profiles?.name ?? 'Desconhecido', calculations: 0 };
    }
    map[id].calculations++;
  }
  return Object.values(map)
    .sort((a, b) => b.calculations - a.calculations)
    .slice(0, 10);
}

function buildTopModels(data: { metadata: Record<string, unknown> | null }[]) {
  const map: Record<string, number> = {};
  for (const row of data) {
    const modelId = row.metadata?.modelId as string | undefined;
    if (modelId) map[modelId] = (map[modelId] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([modelId, uses]) => ({ modelId, uses }))
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 10);
}
