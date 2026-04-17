import { calculateIPU } from "../calc.service";

describe("Calculator Service - IPU", () => {
  // 1. O teste principal com os valores reais que você validou
  it("deve calcular o valor exato de 1.6264 para os inputs de referência", () => {
    const x = 0.0771;
    const y = 0.1506;
    const expected = 1.6264;

    const result = calculateIPU(x, y);

    // toBeCloseTo(valor, precisão) evita falhas por dízimas infinitesimais do JS
    expect(result).toBeCloseTo(expected, 4);
  });

  // 2. Teste de valores inteiros (usando toBeCloseTo para consistência)
  it("deve calcular (x + y) / 0.140 corretamente para números inteiros", () => {
    const x = 10;
    const y = 5;
    const expected = (10 + 5) / 0.140; // ~107.1428

    const result = calculateIPU(x, y);

    expect(result).toBeCloseTo(expected, 4);
  });

  // 3. Caso de borda: entradas zeradas
  it("deve retornar zero quando ambos os inputs forem zero", () => {
    const result = calculateIPU(0, 0);

    expect(result).toBe(0);
  });

  // 4. Teste de precisão com decimais genéricos
  it("deve lidar com valores decimais mantendo a precisão", () => {
    const x = 2.5;
    const y = 1.5;
    const expected = (2.5 + 1.5) / 0.140; // 4 / 0.140

    const result = calculateIPU(x, y);

    expect(result).toBeCloseTo(expected, 4);
  });
});