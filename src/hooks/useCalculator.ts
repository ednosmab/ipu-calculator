import { calculateIPU } from "../services/calculateIPU";
import { useCalculatorLogic } from "./useCalculatorLogic";

export const useCalculator = () => {
  const logic = useCalculatorLogic({
    inputs: ['iso', 'poliol'],
    calculateFn: (iso, poliol) => calculateIPU(iso, poliol),
  });

  return {
    iso: logic.inputs.iso,
    poliol: logic.inputs.poliol,
    setIso: (val: string) => logic.setInputValue('iso', val),
    setPoliol: (val: string) => logic.setInputValue('poliol', val),
    result: logic.result,
    error: logic.error,
    calculate: logic.calculate,
    clear: logic.clear,
  };
};