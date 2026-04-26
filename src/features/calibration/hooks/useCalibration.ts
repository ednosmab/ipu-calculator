import { useEffect, useState } from "react";
import { calculateCalibration } from "../domain/calculateCalibration";
import { calibrationSchema } from "../domain/calibrationSchema";
import { useCalculatorLogic } from "@/hooks/useCalculatorLogic";
import { parseNumber } from "@/core/parsers/numberParser";
import { saveCalculationUseCase } from "@/features/history/application/saveCalculationUseCase";
import { historyRepository } from "@/features/history/infra/historyRepository";
import { CalculationHistory } from "@/features/history/domain/calculationHistory";

export const useCalibration = () => {
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [isHelperActive, setIsHelperActive] = useState(false);

  const loadHistory = async () => {
    const data = await historyRepository.getAll();
    setHistory(data.filter(h => h.type === 'calibration'));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const logic = useCalculatorLogic({
    inputs: ['targetWeight', 'machineValue', 'actualWeight', 'extractedWeight', 'averageValue'],
    calculateFn: (tW, mV, aW) => calculateCalibration(tW, mV, aW),
    validationSchema: calibrationSchema,
    onSuccess: async (inputs, result) => {
      await saveCalculationUseCase({
        type: 'calibration',
        inputs,
        result,
      });
      await loadHistory();
    },
  });

  // Auto-calculate actualWeight when extractedWeight or averageValue changes
  useEffect(() => {
    if (!isHelperActive) return;

    const numExtracted = parseNumber(logic.inputs.extractedWeight) / 100; // Divide by 100
    const numAverage = parseNumber(logic.inputs.averageValue);

    if (numExtracted > 0 && numAverage > 0) {
      const result = numExtracted / numAverage;
      logic.setInputValue('actualWeight', result.toFixed(3));
    }
  }, [logic.inputs.extractedWeight, logic.inputs.averageValue, isHelperActive, logic]);

  const toggleHelper = (value: boolean) => {
    setIsHelperActive(value);
    if (!value) {
      logic.setInputValue('extractedWeight', '');
      logic.setInputValue('averageValue', '');
    }
  };

  const clearHistory = async () => {
    await historyRepository.clear();
    await loadHistory();
  };

  const fillFromHistory = (item: CalculationHistory) => {
    logic.setInputValue('targetWeight', item.inputs.targetWeight?.toString() ?? '');
    logic.setInputValue('machineValue', item.inputs.machineValue?.toString() ?? '');
    logic.setInputValue('actualWeight', item.inputs.actualWeight?.toString() ?? '');
    logic.setInputValue('extractedWeight', item.inputs.extractedWeight?.toString() ?? '');
    logic.setInputValue('averageValue', item.inputs.averageValue?.toString() ?? '');
    if (item.inputs.extractedWeight && item.inputs.averageValue) {
      setIsHelperActive(true);
    }
    logic.calculate();
  };

  return {
    targetWeight: logic.inputs.targetWeight,
    machineValue: logic.inputs.machineValue,
    actualWeight: logic.inputs.actualWeight,
    extractedWeight: logic.inputs.extractedWeight,
    averageValue: logic.inputs.averageValue,
    isHelperActive,
    setTargetWeight: (val: string) => logic.setInputValue('targetWeight', val),
    setMachineValue: (val: string) => logic.setInputValue('machineValue', val),
    setActualWeight: (val: string) => logic.setInputValue('actualWeight', val),
    setExtractedWeight: (val: string) => logic.setInputValue('extractedWeight', val),
    setAverageValue: (val: string) => logic.setInputValue('averageValue', val),
    setIsHelperActive: toggleHelper,
    result: logic.result,
    error: logic.error,
    fieldErrors: logic.fieldErrors,
    calculate: logic.calculate,
    clear: () => {
      logic.clear();
      setIsHelperActive(false);
    },
    history,
    clearHistory,
    fillFromHistory,
  };
};