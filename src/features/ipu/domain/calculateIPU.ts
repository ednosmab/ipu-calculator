import { IPU_CONSTANTS } from "@/core/constants/ipuConstants";

/**
 * Domain rule: IPU (Index of Polyurethane Units) calculation.
 * 
 * Calculates the IPU index from the sum of isocyanate and polyol weights,
 * divided by the reference constant defined in IPU_CONSTANTS.
 * 
 * Formula: ipu = (isocyanate + polyol) / REFERENCE_DIVISOR
 * 
 * @param isocyanate The isocyanate component weight
 * @param polyol     The polyol component weight
 * @returns The calculated IPU index
 */
export const calculateIPU = (isocyanate: number, polyol: number): number => {
  return (isocyanate + polyol) / IPU_CONSTANTS.REFERENCE_DIVISOR;
};
