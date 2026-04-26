import { calibrationSchema } from '../calibrationSchema';

describe('calibrationSchema', () => {
  it('should validate correctly with all fields positive', () => {
    const data = {
      targetWeight: 10,
      machineValue: 20,
      actualWeight: 30,
      extractedWeight: 5,
      averageValue: 2,
    };
    const result = calibrationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should fail if optional fields are 0 (representing empty strings)', () => {
    const data = {
      targetWeight: 10,
      machineValue: 20,
      actualWeight: 30,
      extractedWeight: 0,
      averageValue: 0,
    };
    const result = calibrationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should fail if required fields are 0', () => {
    const data = {
      targetWeight: 0,
      machineValue: 20,
      actualWeight: 30,
    };
    const result = calibrationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
