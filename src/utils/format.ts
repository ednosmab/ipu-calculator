export const formatNumber = (value: number): string => {
  if (Number.isInteger(value)) return value.toLocaleString('pt-BR');
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
};
