export interface IPUInput {
  isocyanate: number;
  polyol: number;
}

export interface CalibrationInput {
  targetWeight: number;
  machineValue: number;
  actualWeight: number;
}

export interface CalculatorResult {
  value: string | null;
  error: string | null;
  fieldErrors: Record<string, string | null>;
}