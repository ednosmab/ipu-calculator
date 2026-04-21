import { z } from 'zod';

export const ipuSchema = z.object({
  isocyanate: z.number({ invalid_type_error: 'Isocyanate must be a number' }).positive('Isocyanate must be greater than zero'),
  polyol: z.number({ invalid_type_error: 'Polyol must be a number' }).positive('Polyol must be greater than zero'),
});
