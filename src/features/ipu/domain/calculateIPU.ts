import { IPU_CONSTANTS } from "../../../core/constants/ipuConstants";

/**
 * Domain rule: IPU (Index of Polyurethane Units) calculation.
 * 
 * Calculates the IPU index from the sum of isocyanate and polyol weights,
 * divided by the reference constant defined in IPU_CONSTANTS.
 * 
 * Formula: ipu = (iso + poliol) / REFERENCE_DIVISOR
 * 
 * @param iso    The isocyanate component weight
 * @param poliol The polyol component weight
 * @returns The calculated IPU index
 */
export const calculateIPU = (iso: number, poliol: number): number => {
  return (iso + poliol) / IPU_CONSTANTS.REFERENCE_DIVISOR;
};
