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
});
