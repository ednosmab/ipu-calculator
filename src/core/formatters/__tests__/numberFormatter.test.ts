import { formatToUserView } from "../numberFormatter";

describe("formatToUserView", () => {
  // Integers

  it("should format integer using pt-BR locale", () => {
    expect(formatToUserView(1000)).toBe("1.000");
  });

  // Decimals

  it("should format decimal numbers with minimum 2 fraction digits", () => {
    expect(formatToUserView(10.5)).toBe("10,50");
  });

  it("should limit maximum fraction digits to 6", () => {
    expect(formatToUserView(1.123456789)).toBe("1,123457");
  });

  it("should keep precision within range (2 to 6 decimals)", () => {
    expect(formatToUserView(2.1234)).toBe("2,1234");
  });

  // Edge cases

  it("should format zero correctly", () => {
    expect(formatToUserView(0)).toBe("0");
  });

  it("should format negative numbers", () => {
    expect(formatToUserView(-1234.5)).toBe("-1.234,50");
  });

  // Unexpected behavior (documented)

  it("should return 'NaN' when input is NaN", () => {
    expect(formatToUserView(NaN)).toBe("NaN");
  });
});
