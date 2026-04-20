import { calculateIPU } from "../calculateIPU";

describe("Calculator Service - IPU", () => {
  it("deve calcular o valor exato de 1.6264 para os inputs de referência", () => {
    const x = 0.0771;
    const y = 0.1506;
    const expected = 1.6264;

    const result = calculateIPU(x, y);

    expect(result).toBeCloseTo(expected, 4);
  });

  it("deve calcular (x + y) / 0.140 corretamente para números inteiros", () => {
    const x = 10;
    const y = 5;
    const expected = (10 + 5) / 0.140;

    const result = calculateIPU(x, y);

    expect(result).toBeCloseTo(expected, 4);
  });

  it("deve retornar zero quando ambos os inputs forem zero", () => {
    const result = calculateIPU(0, 0);

    expect(result).toBe(0);
  });

  it("deve lidar com valores decimais mantendo a precisão", () => {
    const x = 2.5;
    const y = 1.5;
    const expected = (2.5 + 1.5) / 0.140;

    const result = calculateIPU(x, y);

    expect(result).toBeCloseTo(expected, 4);
  });
});
