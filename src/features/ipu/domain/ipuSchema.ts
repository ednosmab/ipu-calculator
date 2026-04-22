import { z } from 'zod';

export const ipuSchema = z.object({
  isocyanate: z.number({ invalid_type_error: 'Informe um número válido' }).positive('Isocianato deve ser maior que zero'),
  polyol: z.number({ invalid_type_error: 'Informe um número válido' }).positive('Poliol deve ser maior que zero'),
});
