import { z } from 'zod';

export const ipuSchema = z.object({
  iso: z.number({ invalid_type_error: 'Iso deve ser um número' }).positive('Iso deve ser maior que zero'),
  poliol: z.number({ invalid_type_error: 'Poliol deve ser um número' }).positive('Poliol deve ser maior que zero'),
});
