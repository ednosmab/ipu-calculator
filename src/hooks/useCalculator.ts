import { useState } from 'react';
import { calculateIPU } from '../services/calc.service';

export const useCalculator = () => {
  const [iso, setIso] = useState('');
  const [poliol, setPoliol] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const parse = (value: string) => parseFloat(value);

  const validate = (i: number, p: number) => {
    return !isNaN(i) && !isNaN(p);
  };

  const calculate = () => {
    if (!iso || !poliol) {
      setError(true);
      return;
    }

    const parsedIso = parse(iso);
    const parsedPoliol = parse(poliol);

    if (!validate(parsedIso, parsedPoliol)) {
      setError(true);
      return;
    }

    const value = calculateIPU(parsedIso, parsedPoliol);

    setResult(value);
    setError(false);
  };

  return {
    iso,
    poliol,
    setIso,
    setPoliol,
    result,
    error,
    calculate
  };
};