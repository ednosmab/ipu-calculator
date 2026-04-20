import { useState } from 'react';
import { formatToUserView } from '../core/formatters/numberFormatter';
import { parseNumber } from '../core/parsers/numberParser';

export type CalculatorConfig<T extends string> = {
  inputs: T[];
  calculateFn: (...args: number[]) => number;
  validate?: (...args: number[]) => boolean;
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
  const [error, setError] = useState(false);

  const setInputValue = (key: T, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const calculate = () => {
    const parsedValues = config.inputs.map((key) => parseNumber(inputs[key]));

    const hasNaN = parsedValues.some((val) => Number.isNaN(val));
    const isValid = !hasNaN && (config.validate ? config.validate(...parsedValues) : true);

    if (!isValid) {
      setError(true);
      setResult(null);
      return;
    }

    setError(false);
    const value = config.calculateFn(...parsedValues);
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
    setError(false);
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
