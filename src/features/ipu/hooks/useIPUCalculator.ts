import { useState, useEffect } from 'react';
import { calculateIPU } from "../domain/calculateIPU";
import { ipuSchema } from "../domain/ipuSchema";
import { useCalculatorLogic } from "@/hooks/useCalculatorLogic";
import { saveCalculationUseCase } from "@/features/history/application/saveCalculationUseCase";
import { historyRepository } from "@/features/history/infra/historyRepository";
import { CalculationHistory } from "@/features/history/domain/calculationHistory";

export const useIPUCalculator = () => {
  const [history, setHistory] = useState<CalculationHistory[]>([]);

  const loadHistory = async () => {
    const data = await historyRepository.getAll();
    setHistory(data.filter(h => h.type === 'ipu'));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const logic = useCalculatorLogic({
    inputs: ['isocyanate', 'polyol'],
    calculateFn: (isocyanate, polyol) => calculateIPU(isocyanate, polyol),
    validationSchema: ipuSchema,
    onSuccess: async (inputs, result) => {
      await saveCalculationUseCase({
        type: 'ipu',
        inputs,
        result,
      });
      await loadHistory();
    },
  });

  const clearHistory = async () => {
    await historyRepository.clear();
    await loadHistory();
  };

  const fillFromHistory = (item: CalculationHistory) => {
    logic.setInputValue('isocyanate', item.inputs.isocyanate?.toString() ?? '');
    logic.setInputValue('polyol', item.inputs.polyol?.toString() ?? '');
    logic.calculate();
  };

  return {
    isocyanate: logic.inputs.isocyanate,
    polyol: logic.inputs.polyol,
    setIsocyanate: (val: string) => logic.setInputValue('isocyanate', val),
    setPolyol: (val: string) => logic.setInputValue('polyol', val),
    result: logic.result,
    error: logic.error,
    fieldErrors: logic.fieldErrors,
    calculate: logic.calculate,
    clear: logic.clear,
    history,
    clearHistory,
    fillFromHistory,
  };
};