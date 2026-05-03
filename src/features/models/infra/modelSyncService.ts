import { supabase } from '@/core/infra/supabaseClient';
import { CalculationModel } from '../domain/calculationModel';
import { logger } from '@/core/logging/logger';

const SYNC_TIMEOUT_MS = 3500;

export const modelSyncService = {
  async syncToRemote(model: CalculationModel): Promise<boolean> {
    // Fast-fail if browser knows it's offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);

    try {
      const { error } = await supabase
        .from('models')
        .upsert({
          id: model.id,
          name: model.name,
          type: model.type,
          inputs: model.inputs,
          updated_at: new Date(model.updatedAt).toISOString(),
        })
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        logger.error('[Supabase Sync Error]:', error.message);
        return false;
      }

      logger.info('[Supabase Sync Success]: Modelo sincronizado com sucesso.');
      return true;
    } catch (e: any) {
      clearTimeout(timeoutId);
      const isTimeout = e.name === 'AbortError';
      logger.error(isTimeout ? '[Supabase Timeout]' : '[Supabase Network Error]:', e.message || e);
      return false;
    }
  },

  async deleteFromRemote(id: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);

    try {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', id)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        logger.error('Error deleting from Supabase:', error.message);
        return false;
      }

      return true;
    } catch (e: any) {
      clearTimeout(timeoutId);
      return false;
    }
  }
};
