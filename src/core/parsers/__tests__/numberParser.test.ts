import { parseNumber } from "../numberParser";

describe("parseNumber", () => {
  // Valid cases

  it("should parse number with comma as decimal separator", () => {
    expect(parseNumber("10,5")).toBe(10.5);
  });

  it("should parse number with dot as decimal separator", () => {
    expect(parseNumber("10.5")).toBe(10.5);
  });

  it("should parse integer string", () => {
    expect(parseNumber("10")).toBe(10);
  });

  // Edge cases

  it("should return 0 for empty string", () => {
    expect(parseNumber("")).toBe(0);
  });

  it("should return 0 for null-like values", () => {
    expect(parseNumber(undefined as unknown as string)).toBe(0);
  });

  // Invalid cases

  it("should return NaN for invalid string", () => {
    expect(parseNumber("abc")).toBeNaN();
  });

  it("should return NaN for malformed number", () => {
    expect(parseNumber("10,5.3")).toBeNaN();
  });

  it("should return NaN for alphanumeric input", () => {
    expect(parseNumber("10a")).toBeNaN();
  });
});
