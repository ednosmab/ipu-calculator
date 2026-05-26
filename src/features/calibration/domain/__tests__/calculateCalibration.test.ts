import { calculateCalibration } from "../calculateCalibration";

describe("calculateCalibration", () => {
  it("should calculate calibration correctly", () => {
    // x = (targetWeight * machineValue) / actualWeight
    expect(calculateCalibration(0.127, 1.253, 0.137)).toBeCloseTo(1.162, 3);
  });

  it("should return 0 if actualWeight is 0 to avoid division by zero", () => {
    expect(calculateCalibration(0, 0, 0)).toBe(0);
  });

  describe("boundary values", () => {
    it("should return 0 when actualWeight is exactly 0 regardless of other values", () => {
      expect(calculateCalibration(100, 50, 0)).toBe(0);
    });

    it("should handle very small actualWeight near zero", () => {
      const result = calculateCalibration(100, 50, 0.0001);

      expect(result).toBeCloseTo((100 * 50) / 0.0001, 0);
      expect(isFinite(result)).toBe(true);
    });

    it("should handle very large values without overflow", () => {
      const result = calculateCalibration(99999, 99999, 0.5);

      expect(isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    });

    it("should handle target weight of 0", () => {
      const result = calculateCalibration(0, 1.253, 0.137);

      expect(result).toBe(0);
    });

    it("should handle machine value of 0", () => {
      const result = calculateCalibration(0.127, 0, 0.137);

      expect(result).toBe(0);
    });

    it("should handle negative targetWeight", () => {
      const result = calculateCalibration(-0.127, 1.253, 0.137);

      expect(result).toBeCloseTo((-0.127 * 1.253) / 0.137, 4);
      expect(result).toBeLessThan(0);
    });

    it("should handle NaN inputs gracefully", () => {
      const result = calculateCalibration(NaN, 1.253, 0.137);

      expect(isNaN(result)).toBe(true);
    });

    it("should handle Infinity inputs gracefully", () => {
      const result = calculateCalibration(Infinity, 1.253, 0.137);

      expect(isFinite(result)).toBe(false);
    });
  });
});
