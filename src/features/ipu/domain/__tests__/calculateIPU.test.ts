import { calculateIPU } from "../calculateIPU";

describe("IPU Domain Logic", () => {
  it("should calculate the exact value of 1.6264 for reference inputs", () => {
    const isocyanate = 0.0771;
    const polyol = 0.1506;
    const expected = 1.6264;

    const result = calculateIPU(isocyanate, polyol);

    expect(result).toBeCloseTo(expected, 4);
  });

  it("should calculate (isocyanate + polyol) / 0.140 correctly for integers", () => {
    const isocyanate = 10;
    const polyol = 5;
    const expected = (10 + 5) / 0.140;

    const result = calculateIPU(isocyanate, polyol);

    expect(result).toBeCloseTo(expected, 4);
  });

  it("should return zero when both inputs are zero", () => {
    const result = calculateIPU(0, 0);

    expect(result).toBe(0);
  });

  it("should handle decimal values maintaining precision", () => {
    const isocyanate = 2.5;
    const polyol = 1.5;
    const expected = (2.5 + 1.5) / 0.140;

    const result = calculateIPU(isocyanate, polyol);

    expect(result).toBeCloseTo(expected, 4);
  });

  describe("boundary values", () => {
    it("should handle very large numbers without overflow", () => {
      const isocyanate = 999999;
      const polyol = 999999;
      const expected = (999999 + 999999) / 0.140;

      const result = calculateIPU(isocyanate, polyol);

      expect(result).toBeCloseTo(expected, 1);
      expect(isFinite(result)).toBe(true);
    });

    it("should handle very small decimal inputs", () => {
      const isocyanate = 0.0001;
      const polyol = 0.0002;
      const expected = (0.0001 + 0.0002) / 0.140;

      const result = calculateIPU(isocyanate, polyol);

      expect(result).toBeCloseTo(expected, 6);
    });

    it("should handle one zero input and one positive input", () => {
      const result = calculateIPU(0, 0.1506);

      expect(result).toBeCloseTo(0.1506 / 0.140, 4);
    });

    it("should handle negative inputs", () => {
      const result = calculateIPU(-0.0771, -0.1506);

      expect(result).toBeCloseTo((-0.0771 - 0.1506) / 0.140, 4);
      expect(result).toBeLessThan(0);
    });

    it("should handle NaN isocyanate gracefully", () => {
      const result = calculateIPU(NaN, 0.1506);

      expect(isNaN(result)).toBe(true);
    });

    it("should handle Infinity polyol gracefully", () => {
      const result = calculateIPU(0.0771, Infinity);

      expect(isFinite(result)).toBe(false);
    });
  });
});
