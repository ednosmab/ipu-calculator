import { z } from 'zod';

export const calibrationSchema = z.object({
  targetWeight: z.number({ invalid_type_error: 'Target weight must be a number' }).positive('Target weight must be greater than zero'),
  machineValue: z.number({ invalid_type_error: 'Machine value must be a number' }).positive('Machine value must be greater than zero'),
  actualWeight: z.number({ invalid_type_error: 'Actual weight must be a number' }).refine(val => val !== 0, {
    message: 'Actual weight cannot be zero',
  }),
});
