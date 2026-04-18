export function parseNumber(value: string): number {
  if (!value) return 0;

  const normalized = value
    .trim()
    .replace(",", ".");

  const result = Number(normalized);

  return Number.isNaN(result) ? NaN : result;
}