import { z } from 'zod';

export const ipuSchema = z.object({
  isocyanate: z.number({ message: 'Informe um número válido' }).positive({ message: 'Isocianato deve ser maior que zero' }),
  polyol: z.number({ message: 'Informe um número válido' }).positive({ message: 'Poliol deve ser maior que zero' }),
});
