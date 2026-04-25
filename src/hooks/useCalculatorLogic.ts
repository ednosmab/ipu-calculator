import { useState } from 'react';
import { z } from 'zod';
import { formatToUserView } from '../core/formatters/numberFormatter';
import { parseNumber } from '../core/parsers/numberParser';

export type CalculatorConfig<T extends string> = {
  inputs: T[];
  calculateFn: (...args: number[]) => number;
  validationSchema?: z.ZodObject<any>;
  onSuccess?: (inputs: Record<string, number>, result: number) => void | Promise<void>;
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
  const [fieldErrors, setFieldErrors] = useState<Record<T, string | null>>(() => {
    const initial = {} as Record<T, string | null>;
    config.inputs.forEach((key) => {
      initial[key] = null;
    });
    return initial;
  });

  const setInputValue = (key: T, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    setFieldErrors((prev) => ({ ...prev, [key]: null }));
  };

  const calculate = () => {
    // 1. Transform inputs to numbers for validation/calculation
    const numericValues: Record<string, number> = {};
    config.inputs.forEach((key) => {
      numericValues[key] = parseNumber(inputs[key]);
    });

    // Reset errors
    setError(null);
    const initialFieldErrors = {} as Record<T, string | null>;
    config.inputs.forEach((key) => {
      initialFieldErrors[key] = null;
    });
    setFieldErrors(initialFieldErrors);

    // 2. Validate using Zod schema if provided
    if (config.validationSchema) {
      const validation = config.validationSchema.safeParse(numericValues);
      if (!validation.success) {
        const newFieldErrors = { ...initialFieldErrors };
        validation.error.issues.forEach((issue) => {
          const path = issue.path[0] as T;
          if (path && config.inputs.includes(path)) {
            newFieldErrors[path] = issue.message;
          }
        });
        setFieldErrors(newFieldErrors);
        
        // Show first error as global error for fallback
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

    const parsedArgs = config.inputs.map((key) => numericValues[key]);
    const value = config.calculateFn(...parsedArgs);
    setResult(formatToUserView(value));

    if (config.onSuccess) {
      config.onSuccess(numericValues, value);
    }
  };

  const clear = () => {
    setInputs(() => {
      const initial = {} as Record<T, string>;
      config.inputs.forEach((key) => {
        initial[key] = '';
      });
      return initial;
    });
    const initialFieldErrors = {} as Record<T, string | null>;
    config.inputs.forEach((key) => {
      initialFieldErrors[key] = null;
    });
    setFieldErrors(initialFieldErrors);
    setResult(null);
    setError(null);
  };

  return {
    inputs,
    setInputValue,
    result,
    error,
    fieldErrors,
    calculate,
    clear,
  };
};
