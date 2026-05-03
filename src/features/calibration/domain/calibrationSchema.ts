import { z } from 'zod';

export const calibrationSchema = z.object({
  targetWeight: z.number({ message: 'Informe um número válido' }).positive({ message: 'Peso desejado deve ser maior que zero' }),
  machineValue: z.number({ message: 'Informe um número válido' }).positive({ message: 'Valor da máquina deve ser maior que zero' }),
  actualWeight: z.number({ message: 'Informe um número válido' }).positive({ message: 'Peso real deve ser maior que zero' }),
  extractedWeight: z.number({ message: 'Informe um número válido' }).positive({ message: 'Peso extraído deve ser maior que zero' }).optional(),
  averageValue: z.number({ message: 'Informe um número válido' }).positive({ message: 'Valor da média deve ser maior que zero' }).optional(),
});
