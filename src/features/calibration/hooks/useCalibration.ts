import { calculateCalibration } from "../domain/calculateCalibration";
import { calibrationSchema } from "../domain/calibrationSchema";
import { useCalculatorLogic } from "../../../hooks/useCalculatorLogic";

export const useCalibration = () => {
  const logic = useCalculatorLogic({
    inputs: ['pesoDesejado', 'valorMaquina', 'pesoReal'],
    calculateFn: (pD, vM, pR) => calculateCalibration(pD, vM, pR),
    validationSchema: calibrationSchema,
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