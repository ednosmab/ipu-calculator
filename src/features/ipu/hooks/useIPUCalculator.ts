import { calculateIPU } from "../domain/calculateIPU";
import { ipuSchema } from "../domain/ipuSchema";
import { useCalculatorLogic } from "../../../hooks/useCalculatorLogic";

export const useIPUCalculator = () => {
  const logic = useCalculatorLogic({
    inputs: ['iso', 'poliol'],
    calculateFn: (iso, poliol) => calculateIPU(iso, poliol),
    validationSchema: ipuSchema,
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