import { calculateCalibration } from '../services/calculateCalibration';
import { useCalculatorLogic } from './useCalculatorLogic';

export const useCalibration = () => {
  const logic = useCalculatorLogic({
    inputs: ['pesoDesejado', 'valorMaquina', 'pesoReal'],
    calculateFn: (pD, vM, pR) => calculateCalibration(pD, vM, pR),
    validate: (_, __, pR) => pR !== 0,
  });

  return {
    pesoDesejado: logic.inputs.pesoDesejado,
    valorMaquina: logic.inputs.valorMaquina,
    pesoReal: logic.inputs.pesoReal,
    setPesoDesejado: (val: string) => logic.setInputValue('pesoDesejado', val),
    setValorMaquina: (val: string) => logic.setInputValue('valorMaquina', val),
    setPesoReal: (val: string) => logic.setInputValue('pesoReal', val),
    result: logic.result,
    error: logic.error,
    calculate: logic.calculate,
    clear: logic.clear,
  };
};