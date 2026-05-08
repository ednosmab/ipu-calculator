// supabase/functions/_shared/auditLogger.ts
// Logger de auditoria — fire-and-forget, falha não impede a resposta principal

import { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface LogParams {
  supabase: SupabaseClient;
  userId: string | null;
  action: string;
  resource?: string;
  metadata?: Record<string, unknown>;
  req: Request;
}

/**
 * Registra uma ação em access_logs.
 * SEMPRE chamar sem await (fire-and-forget):
 *   logAccess({ ... }); // sem await
 */
export async function logAccess({
  supabase,
  userId,
  action,
  resource,
  metadata,
  req,
}: LogParams): Promise<void> {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const userAgent = req.headers.get('user-agent') ?? '';
  const platform = detectPlatform(userAgent);

  const { error } = await supabase.from('access_logs').insert({
    user_id: userId,
    action,
    resource,
    metadata,
    ip,
    platform,
  });

  if (error) {
    // Falha no log não propaga — só registra no console
    console.error('[AuditLogger] Falha ao registrar log:', error.message);
  }
}

function detectPlatform(userAgent: string): string {
  if (userAgent.includes('Expo')) return 'native';
  if (userAgent.includes('Android')) return 'android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'ios';
  return 'web';
}
