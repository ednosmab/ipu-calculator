import { calculateIPU } from "../domain/calculateIPU";
import { ipuSchema } from "../domain/ipuSchema";
import { useCalculatorLogic } from "../../../hooks/useCalculatorLogic";

export const useIPUCalculator = () => {
  const logic = useCalculatorLogic({
    inputs: ['isocyanate', 'polyol'],
    calculateFn: (isocyanate, polyol) => calculateIPU(isocyanate, polyol),
    validationSchema: ipuSchema,
  });

  return {
    isocyanate: logic.inputs.isocyanate,
    polyol: logic.inputs.polyol,
    setIsocyanate: (val: string) => logic.setInputValue('isocyanate', val),
    setPolyol: (val: string) => logic.setInputValue('polyol', val),
    result: logic.result,
    error: logic.error,
    calculate: logic.calculate,
    clear: logic.clear,
  };
};