import { useState } from 'react';
import { z } from 'zod';
import { formatToUserView } from '../core/formatters/numberFormatter';
import { parseNumber } from '../core/parsers/numberParser';

export type CalculatorConfig<T extends string> = {
  inputs: T[];
  calculateFn: (...args: number[]) => number;
  validationSchema?: z.ZodObject<any>;
};

export const useCalculatorLogic = <T extends string>(config: CalculatorConfig<T>) => {
  const [inputs, setInputs] = useState<Record<T, string>>(() => {
    const initial = {} as Record<T, string>;
    config.inputs.forEach((key) => {
      initial[key] = '';
    });
    return initial;
  });

  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setInputValue = (key: T, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const calculate = () => {
    // 1. Transform inputs to numbers for validation/calculation
    const numericValues: Record<string, number> = {};
    config.inputs.forEach((key) => {
      numericValues[key] = parseNumber(inputs[key]);
    });

    // 2. Validate using Zod schema if provided
    if (config.validationSchema) {
      const validation = config.validationSchema.safeParse(numericValues);
      if (!validation.success) {
        setError(validation.error.issues[0].message);
        setResult(null);
        return;
      }
    } else {
      // Fallback for simple NaN check if no schema
      const hasNaN = Object.values(numericValues).some((val) => Number.isNaN(val));
      if (hasNaN) {
        setError('Valores inválidos');
        setResult(null);
        return;
      }
    }

    setError(null);
    const parsedArgs = config.inputs.map((key) => numericValues[key]);
    const value = config.calculateFn(...parsedArgs);
    setResult(formatToUserView(value));
  };

  const clear = () => {
    setInputs(() => {
      const initial = {} as Record<T, string>;
      config.inputs.forEach((key) => {
        initial[key] = '';
      });
      return initial;
    });
    setResult(null);
    setError(null);
  };

  return {
    inputs,
    setInputValue,
    result,
    error,
    calculate,
    clear,
  };
};
