/**
 * Domain rule: IPU (Index of Polyurethane Units) calculation.
 * 
 * Calculates the IPU index from the sum of isocyanate and polyol weights,
 * divided by the reference constant 0.140.
 * 
 * Formula: ipu = (iso + poliol) / 0.140
 * 
 * @param iso    The isocyanate component weight
 * @param poliol The polyol component weight
 * @returns The calculated IPU index
 */
export const calculateIPU = (iso: number, poliol: number): number => {
  return (iso + poliol) / 0.140;
};
