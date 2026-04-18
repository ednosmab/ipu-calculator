export const calculateCalibration = (
  pesoDesejado: number,
  valorMaquina: number,
  pesoReal: number
): number => {
  if (pesoReal === 0) return 0; // Previne divisão por zero, embora o hook já faça essa checagem
  return (pesoDesejado * valorMaquina) / pesoReal;
};
