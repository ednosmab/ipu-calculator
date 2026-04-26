import { supabase } from '@/core/infra/supabaseClient';
import { CalculationModel } from '../domain/calculationModel';

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
        console.error('Error syncing model to Supabase:', error);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Network error during sync:', e);
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
        console.error('Error deleting model from Supabase:', error);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Network error during remote delete:', e);
      return false;
    }
  }
};
