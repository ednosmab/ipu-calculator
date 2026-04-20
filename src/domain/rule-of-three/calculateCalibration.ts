/**
 * Domain rule: Calibration calculation using the Rule of Three.
 * 
 * Given a desired weight, the machine's current value, and the actual measured weight,
 * this function calculates the corrected machine value needed to achieve the target weight.
 * 
 * Formula: correctedValue = (targetWeight * machineValue) / actualWeight
 * 
 * @param targetWeight  The desired output weight
 * @param machineValue  The value currently configured on the machine
 * @param actualWeight  The actual measured weight from the machine
 * @returns The corrected machine value, or 0 if actualWeight is 0 (division by zero guard)
 */
export const calculateCalibration = (
  targetWeight: number,
  machineValue: number,
  actualWeight: number
): number => {
  if (actualWeight === 0) return 0;
  return (targetWeight * machineValue) / actualWeight;
};
