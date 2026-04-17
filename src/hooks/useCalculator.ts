import { useState } from 'react';

export const useCalculator = () => {
  const [iso, setIso] = useState('');
  const [poliol, setPoliol] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const calculate = () => {
    if (!iso || !poliol) return setError(true);

    const i = parseFloat(iso);
    const p = parseFloat(poliol);

    if (isNaN(i) || isNaN(p)) return setError(true);

    setResult((i + p) / 0.140);
    setError(false);
  };

  return { iso, poliol, setIso, setPoliol, result, error, calculate };
};
