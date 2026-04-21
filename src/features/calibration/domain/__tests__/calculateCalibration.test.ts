import { calculateCalibration } from "../calculateCalibration";

describe("calculateCalibration", () => {
  it("should calculate calibration correctly", () => {
    // x = (targetWeight * machineValue) / actualWeight
    expect(calculateCalibration(0.127, 1.253, 0.137)).toBeCloseTo(1.162, 3);
  });

  it("should return 0 if actualWeight is 0 to avoid division by zero", () => {
    expect(calculateCalibration(0, 0, 0)).toBe(0);
  });
});
