import { useState } from 'react';
import { calculateCalibration } from '../services/calculateCalibration';
import { formatNumber } from '../utils/number/formatNumber';
import { parseNumber } from '../utils/number/numberParser';

export const useCalibration = () => {
  const [pesoDesejado, setPesoDesejado] = useState('');
  const [valorMaquina, setValorMaquina] = useState('');
  const [pesoReal, setPesoReal] = useState('');

  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const calculate = () => {
    const pDesejado = parseNumber(pesoDesejado);
    const vMaquina = parseNumber(valorMaquina);
    const pReal = parseNumber(pesoReal);

    // 🔴 validações críticas
    if (
      Number.isNaN(pDesejado) ||
      Number.isNaN(vMaquina) ||
      Number.isNaN(pReal) ||
      pReal === 0
    ) {
      setError(true);
      setResult(null);
      return;
    }

    setError(false);

    const value = calculateCalibration(pDesejado, vMaquina, pReal);
    const formatted = formatNumber(value);

    setResult(formatted);
  };

  const clear = () => {
    setPesoDesejado("");
    setValorMaquina("");
    setPesoReal("");
    setResult(null);
    setError(false);
  };

  return {
    pesoDesejado,
    valorMaquina,
    pesoReal,
    setPesoDesejado,
    setValorMaquina,
    setPesoReal,
    result,
    error,
    calculate,
    clear,
  };
};