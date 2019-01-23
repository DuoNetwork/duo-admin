import * as CST from '../common/constants';
import { IOption } from '../common/types';
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

test('composeQuery', () => {
	expect(
		util.composeQuery({
			key1: 'value1',
			key2: 'value2'
		})
	).toMatchSnapshot();
});

test('parseOptions default', () => {
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	const command = [
		'npm',
		'run',
		'trades',
		'source=',
		'pair=',
		'event=',
		'provider=',
		'contractType=',
		'tenor='
	];
	expect(util.parseOptions(command)).toMatchSnapshot();
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
		'end=20180930T100000',
		'exSources=ex1,ex2',
		'sources=s1,s2',
		'pair=pair',
		'event=event',
		'provider=provider',
		'contractType=contractType',
		'tenor=tenor'
	];
	expect(util.parseOptions(command)).toMatchSnapshot();
});

test('getPeriodStartTimestamp', () => {
	// 1970-01-15 6:56:07
	// util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	// 1970-01-15 6:55:00
	expect(util.getPeriodStartTimestamp(1234567890)).toBe(1234500000);
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

const toolToTest = [
	CST.TRADES,
	CST.COMMIT,
	CST.CLEAN_DB,
	CST.TRIGGER,
	CST.FETCH_EVENTS,
	CST.FETCH_PRICE,
	CST.DB_PRICES
];

const option: IOption = util.parseOptions(['npm', 'run', 'tool', 'period=1']);

for (const tool of toolToTest) {
	test(`getStatusProcess ${tool} useDynamo`, () => {
		option.dynamo = true;
		expect(util.getStatusProcess(tool, option)).toMatchSnapshot();
	});

	test(`getStatusProcess ${tool} do not useDynamo`, () => {
		option.dynamo = false;
		expect(util.getStatusProcess(tool, option)).toMatchSnapshot();
	});
}

test(`getStatusProcess PRICE`, () => {
	option.aws = true;
	option.gcp = false;
	option.azure = false;
	option.dynamo = true;
	option.period = 60;
	expect(util.getStatusProcess(CST.DB_PRICES, option)).toMatchSnapshot();
	option.period = 10;
	expect(util.getStatusProcess(CST.DB_PRICES, option)).toMatchSnapshot();
});

test(`getStatusProcess EVENT`, () => {
	option.gcp = true;
	option.aws = false;
	option.azure = false;
	option.dynamo = true;
	option.event = 'StartPreReset';
	expect(util.getStatusProcess(CST.FETCH_EVENTS, option)).toMatchSnapshot();
});

test(`getStatusProcess TRADES`, () => {
	option.azure = true;
	option.gcp = false;
	option.aws = false;
	option.dynamo = true;
	option.source = 'source';
	expect(util.getStatusProcess(CST.TRADES, option)).toMatchSnapshot();
});

test('log error', () => {
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	console.log = jest.fn();

	util.logLevel = CST.LOG_ERROR;
	util.logError('error');
	util.logInfo('info');
	util.logDebug('debug');
	expect((console.log as jest.Mock).mock.calls).toMatchSnapshot();
});

test('log info', () => {
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	console.log = jest.fn();

	util.logLevel = CST.LOG_INFO;
	util.logError('error');
	util.logInfo('info');
	util.logDebug('debug');
	expect((console.log as jest.Mock).mock.calls).toMatchSnapshot();
});

test('log debug', () => {
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	console.log = jest.fn();

	util.logLevel = CST.LOG_DEBUG;
	util.logError('error');
	util.logInfo('info');
	util.logDebug('debug');
	expect((console.log as jest.Mock).mock.calls).toMatchSnapshot();
});

test('sleep', async () => {
	global.setTimeout = jest.fn(resolve => resolve());
	await util.sleep(1);
	expect((global.setTimeout as jest.Mock).mock.calls).toMatchSnapshot();
});
