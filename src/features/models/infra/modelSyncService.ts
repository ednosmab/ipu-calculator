import { supabase } from '@/core/infra/supabaseClient';
import { CalculationModel } from '../domain/calculationModel';
import { logger } from '@/core/logging/logger';

export const modelSyncService = {
  async syncToRemote(model: CalculationModel): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('models')
        .upsert({
          id: model.id,
          name: model.name,
          type: model.type,
          inputs: model.inputs,
          updated_at: new Date(model.updatedAt).toISOString(),
        });

      if (error) {
        logger.error('[Supabase Sync Error]:', error.message, error.details);
        return false;
      }

      logger.info('[Supabase Sync Success]: Modelo sincronizado com sucesso.');
      return true;
    } catch (e) {
      logger.error('Network error during sync:', e);
      return false;
    }
  },

  async deleteFromRemote(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting model from Supabase:', error);
        return false;
      }

      return true;
    } catch (e) {
      logger.error('Network error during remote delete:', e);
      return false;
    }
  }
};
