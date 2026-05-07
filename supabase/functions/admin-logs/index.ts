// supabase/functions/admin-logs/index.ts
// GET /admin-logs — lista access_logs com filtros e paginação (admin only)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { requireAuth, AuthError } from '../_shared/authMiddleware.ts';
import { ok, err } from '../_shared/response.ts';

const PAGE_SIZE = 50;

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') return err('METHOD_NOT_ALLOWED', 405);

  try {
    const { user } = await requireAuth(req, 'admin');

    const url = new URL(req.url);
    const userId   = url.searchParams.get('user_id');
    const action   = url.searchParams.get('action');
    const platform = url.searchParams.get('platform');
    const start    = url.searchParams.get('start');
    const end      = url.searchParams.get('end');
    const page     = parseInt(url.searchParams.get('page') ?? '0', 10);
    const offset   = page * PAGE_SIZE;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SECRET_KEYS')!
    );

    let query = supabase
      .from('access_logs')
      .select('*, profiles(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (userId)   query = query.eq('user_id', userId);
    if (action)   query = query.eq('action', action);
    if (platform) query = query.eq('platform', platform);
    if (start)    query = query.gte('created_at', start);
    if (end)      query = query.lte('created_at', end);

    const { data, error, count } = await query;

    if (error) {
      console.error('[admin-logs] Erro na query:', error);
      return err('INTERNAL_ERROR', 500);
    }

    void user; // usado apenas para autorização

    return ok({ logs: data, total: count, page, pageSize: PAGE_SIZE }, 200, req.headers.get('origin'));
  } catch (error) {
    if (error instanceof AuthError) return err(error.code, error.status);
    console.error('[admin-logs] Erro inesperado:', error);
    return err('INTERNAL_ERROR', 500);
  }
});

/*
  curl "https://<project>.supabase.co/functions/v1/admin-logs?page=0&action=login" \
    -H "Authorization: Bearer <admin_token>"
*/
