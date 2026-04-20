/**
 * Parses a numeric string into a number, handling comma as a decimal separator.
 * 
 * @param value The string representation of the number
 * @returns The parsed number, or 0 if empty, or NaN if invalid
 */
export function parseNumber(value: string): number {
  if (!value) return 0;

  const normalized = value
    .trim()
    .replace(",", ".");

  const result = Number(normalized);

  return Number.isNaN(result) ? NaN : result;
}
