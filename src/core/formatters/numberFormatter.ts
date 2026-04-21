/**
 * Formats a numeric value for display to the user using Brazilian Portuguese locale.
 * If the value is an integer, it returns it without decimal places.
 * Otherwise, it formats with a minimum of 2 and maximum of 6 decimal places.
 * 
 * @param value The numeric value to format
 * @returns A string representation of the number formatted for the UI
 */
export const formatToUserView = (value: number): string => {
  if (Number.isInteger(value)) return value.toLocaleString('pt-BR');

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
};
