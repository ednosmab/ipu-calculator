import { calculateCalibration } from "../calculateCalibration";

describe("calculateCalibration", () => {
  it("should calculate calibration correctly", () => {
    // x = (pesoDesejado * valorMaquina) / pesoReal
    expect(calculateCalibration(0.127, 1.253, 0.137)).toBeCloseTo(1.162, 3);
  });

  it("should return 0 if pesoReal is 0 to avoid division by zero", () => {
    expect(calculateCalibration(0, 0, 0)).toBe(0);
  });
});
