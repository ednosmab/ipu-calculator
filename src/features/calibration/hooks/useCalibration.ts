import { useEffect, useState } from "react";
import { calculateCalibration } from "../domain/calculateCalibration";
import { calibrationSchema } from "../domain/calibrationSchema";
import { useCalculatorLogic } from "../../../hooks/useCalculatorLogic";
import { parseNumber } from "../../../core/parsers/numberParser";

export const useCalibration = () => {
  const logic = useCalculatorLogic({
    inputs: ['targetWeight', 'machineValue', 'actualWeight'],
    calculateFn: (tW, mV, aW) => calculateCalibration(tW, mV, aW),
    validationSchema: calibrationSchema,
  });

  const [extractedWeight, setExtractedWeight] = useState('');
  const [averageValue, setAverageValue] = useState('');

  // Auto-calculate actualWeight when extractedWeight or averageValue changes
  useEffect(() => {
    const numExtracted = parseNumber(extractedWeight);
    const numAverage = parseNumber(averageValue);

    if (numExtracted > 0 && numAverage > 0) {
      const result = numExtracted / numAverage;
      logic.setInputValue('actualWeight', result.toString());
    }
  }, [extractedWeight, averageValue]);

  return {
    targetWeight: logic.inputs.targetWeight,
    machineValue: logic.inputs.machineValue,
    actualWeight: logic.inputs.actualWeight,
    extractedWeight,
    averageValue,
    setTargetWeight: (val: string) => logic.setInputValue('targetWeight', val),
    setMachineValue: (val: string) => logic.setInputValue('machineValue', val),
    setActualWeight: (val: string) => logic.setInputValue('actualWeight', val),
    setExtractedWeight,
    setAverageValue,
    result: logic.result,
    error: logic.error,
    calculate: logic.calculate,
    clear: () => {
      logic.clear();
      setExtractedWeight('');
      setAverageValue('');
    },
  };
};