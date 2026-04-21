/**
 * Generic math calculation utilities for the domain layer.
 */

/**
 * Applies the rule of three to find the fourth value.
 * Given: a/b = c/x => x = (b * c) / a
 *
 * @param a The known base value (denominator reference)
 * @param b The known result for `a`
 * @param c The target input
 * @returns The proportional result for `c`
 */
export const ruleOfThree = (a: number, b: number, c: number): number => {
  if (a === 0) return 0;
  return (b * c) / a;
};
