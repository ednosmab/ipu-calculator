import { z } from 'zod';

export const calibrationSchema = z.object({
  targetWeight: z.number({ invalid_type_error: 'Informe um número válido' }).positive('Peso desejado deve ser maior que zero'),
  machineValue: z.number({ invalid_type_error: 'Informe um número válido' }).positive('Valor da máquina deve ser maior que zero'),
  actualWeight: z.number({ invalid_type_error: 'Informe um número válido' }).positive('Peso real deve ser maior que zero'),
});
