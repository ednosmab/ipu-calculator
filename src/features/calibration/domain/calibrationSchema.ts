import { z } from 'zod';

export const calibrationSchema = z.object({
  pesoDesejado: z.number({ invalid_type_error: 'Peso desejado deve ser um número' }).positive('Peso desejado deve ser maior que zero'),
  valorMaquina: z.number({ invalid_type_error: 'Valor da máquina deve ser um número' }).positive('Valor da máquina deve ser maior que zero'),
  pesoReal: z.number({ invalid_type_error: 'Peso real deve ser um número' }).refine(val => val !== 0, {
    message: 'Peso real não pode ser zero',
  }),
});
