import util from './util';

test('isNumber() return true for numbers', () => {
	expect(util.isNumber(5)).toBe(true);
	expect(util.isNumber(5.0)).toBe(true);
});

test('isNumber() return true for empty string and null', () => {
	expect(util.isNumber('')).toBe(true);
	expect(util.isNumber(null)).toBe(true);
});

test('isNumber() return true for number strings', () => {
	expect(util.isNumber('5')).toBe(true);
	expect(util.isNumber('5.0')).toBe(true);
});

test('isNumber() return false for other strings', () => {
	expect(util.isNumber('5.0s')).toBe(false);
	expect(util.isNumber('test')).toBe(false);
	expect(util.isNumber('NaN')).toBe(false);
});

test('isNumber() return false for undefined, infinity, NaN', () => {
	expect(util.isNumber(undefined)).toBe(false);
	expect(util.isNumber(Infinity)).toBe(false);
	expect(util.isNumber(NaN)).toBe(false);
});
