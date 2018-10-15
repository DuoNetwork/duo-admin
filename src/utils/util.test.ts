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

test('{}, null, undefined is empty', () => {
	expect(util.isEmptyObject({})).toBe(true);
	expect(util.isEmptyObject(null)).toBe(true);
	expect(util.isEmptyObject(undefined)).toBe(true);
});

test('{test: true} is not empty', () => {
	expect(util.isEmptyObject({ test: true })).toBe(false);
});

test('parseOptions', () => {
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	const command = [
		'npm',
		'run',
		'trades',
		'source=source',
		'assets=quote,base',
		'period=10',
		'start=20180930T080000',
		'end=20180930T100000'
	];
	expect(util.parseOptions(command)).toMatchSnapshot();
});

test('getPeriodStartTimestamp', () => {
	// 1970-01-15 6:56:07
	// util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	// 1970-01-15 6:55:00
	expect(util.getPeriodStartTimestamp(1234567890, 1)).toBe(1234500000);
	// 1970-01-15 6:40:00
	expect(util.getPeriodStartTimestamp(1234567890, 10)).toBe(1233600000);
	// 1970-01-15 5:00:00
	expect(util.getPeriodStartTimestamp(1234567890, 60)).toBe(1227600000);
	// 1970-01-15 0:00:00
	expect(util.getPeriodStartTimestamp(1234567890, 360)).toBe(1209600000);
	// 1970-01-14 0:00:00
	expect(util.getPeriodStartTimestamp(1234567890, 1440)).toBe(1123200000);
});
