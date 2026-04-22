describe('calculateIPU', () => {
    test('should correctly calculate the IPU for given inputs', () => {
        expect(calculateIPU(10, 5)).toBe(2);
        expect(calculateIPU(100, 50)).toBe(2);
        expect(calculateIPU(0, 0)).toBe(0);
    });
});

describe('parseNumber', () => {
    test('should parse string to number', () => {
        expect(parseNumber('10')).toBe(10);
        expect(parseNumber('0.5')).toBe(0.5);
        expect(parseNumber('-10')).toBe(-10);
    });

    test('should return NaN for invalid inputs', () => {
        expect(parseNumber('abc')).toBeNaN();
        expect(parseNumber('10abc')).toBeNaN();
    });
});

describe('formatToUserView', () => {
    test('should format number to user view correctly', () => {
        expect(formatToUserView(1000)).toBe('1,000');
        expect(formatToUserView(1000000)).toBe('1,000,000');
    });
});
