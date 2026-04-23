import { useEffect, useState } from "react";
import { calculateCalibration } from "../domain/calculateCalibration";
import { calibrationSchema } from "../domain/calibrationSchema";
import { useCalculatorLogic } from "@/hooks/useCalculatorLogic";
import { parseNumber } from "@/core/parsers/numberParser";

export const useCalibration = () => {
  const logic = useCalculatorLogic({
    inputs: ['targetWeight', 'machineValue', 'actualWeight'],
    calculateFn: (tW, mV, aW) => calculateCalibration(tW, mV, aW),
    validationSchema: calibrationSchema,
  });

  const [extractedWeight, setExtractedWeight] = useState('');
  const [averageValue, setAverageValue] = useState('');
  const [isHelperActive, setIsHelperActive] = useState(false);

  // Auto-calculate actualWeight when extractedWeight or averageValue changes
  useEffect(() => {
    if (!isHelperActive) return;

    const numExtracted = parseNumber(extractedWeight) / 100; // Divide by 100
    const numAverage = parseNumber(averageValue);

    if (numExtracted > 0 && numAverage > 0) {
      const result = numExtracted / numAverage;
      logic.setInputValue('actualWeight', result.toFixed(3));
    }
  }, [extractedWeight, averageValue, isHelperActive, logic]);

  const toggleHelper = (value: boolean) => {
    setIsHelperActive(value);
    if (!value) {
      setExtractedWeight('');
      setAverageValue('');
    }
  };

  return {
    targetWeight: logic.inputs.targetWeight,
    machineValue: logic.inputs.machineValue,
    actualWeight: logic.inputs.actualWeight,
    extractedWeight,
    averageValue,
    isHelperActive,
    setTargetWeight: (val: string) => logic.setInputValue('targetWeight', val),
    setMachineValue: (val: string) => logic.setInputValue('machineValue', val),
    setActualWeight: (val: string) => logic.setInputValue('actualWeight', val),
    setExtractedWeight,
    setAverageValue,
    setIsHelperActive: toggleHelper,
    result: logic.result,
    error: logic.error,
    fieldErrors: logic.fieldErrors,
    calculate: logic.calculate,
    clear: () => {
      logic.clear();
      setExtractedWeight('');
      setAverageValue('');
      setIsHelperActive(false);
    },
  };
};