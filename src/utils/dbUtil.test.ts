// fix for @ledgerhq/hw-transport-u2f 4.28.0
import '@babel/polyfill';
import * as Constants from '@finbook/duo-market-data/dist/constants';
import dbUtil from './dbUtil';
import keyUtil from './keyUtil';
// import SqlUtil from './sqlUtil';
import util from './util';

jest.mock('@finbook/duo-market-data', () => ({
	Constants: Constants,
	DynamoUtil: jest.fn(() => ({ test: 'DynamoUtil' }))
}));
jest.mock('./sqlUtil', () =>
	jest.fn(() => ({
		init: jest.fn(() => Promise.resolve())
	}))
);

import { DynamoUtil } from '@finbook/duo-market-data';

test('init only dynamo', async () => {
	keyUtil.getSqlAuth = jest.fn(() => Promise.resolve());
	util.getStatusProcess = jest.fn(() => 'process');
	await dbUtil.init('tool', { dynamo: true, live: true } as any);
	expect(dbUtil.dynamo).toBeTruthy();
	expect(dbUtil.dynamoUtil).toMatchSnapshot();
	expect((DynamoUtil as any).mock.calls[0].slice(1)).toMatchSnapshot();
	expect(dbUtil.sqlUtil).toBeFalsy();
	expect(keyUtil.getSqlAuth as jest.Mock).not.toBeCalled();
});

test('init server', async () => {
	keyUtil.getSqlAuth = jest.fn(() =>
		Promise.resolve({
			host: '',
			user: '',
			password: ''
		})
	);
	util.getStatusProcess = jest.fn(() => 'process');
	await dbUtil.init('trades', { live: false, server: true } as any);
	expect(dbUtil.dynamo).toBeFalsy();
	expect(dbUtil.dynamoUtil).toMatchSnapshot();
	expect((DynamoUtil as any).mock.calls[1].slice(1)).toMatchSnapshot();
	expect(dbUtil.sqlUtil).toBeTruthy();
	expect((dbUtil.sqlUtil as any).init as jest.Mock).toBeCalledTimes(1);
	expect(keyUtil.getSqlAuth as jest.Mock).toBeCalledTimes(1);
});

test('insertTradeData', async () => {
	dbUtil.dynamo = false;
	dbUtil.dynamoUtil = null;
	dbUtil.sqlUtil = null;
	try {
		await dbUtil.insertTradeData('trade' as any, true);
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamoUtil = { insertTradeData: jest.fn() } as any;
	dbUtil.sqlUtil = { insertTradeData: jest.fn() } as any;
	dbUtil.dynamo = true;
	await dbUtil.insertTradeData('trade' as any, true);
	dbUtil.dynamo = false;
	await dbUtil.insertTradeData('trade' as any, false);
	expect(((dbUtil.dynamoUtil as any).insertTradeData as jest.Mock).mock.calls).toMatchSnapshot();
	expect(((dbUtil.sqlUtil as any).insertTradeData as jest.Mock).mock.calls).toMatchSnapshot();
});

test('insertPrice', async () => {
	dbUtil.dynamo = false;
	dbUtil.sqlUtil = null;
	try {
		await dbUtil.insertPrice('price' as any);
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamo = true;
	try {
		await dbUtil.insertPrice('price' as any);
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamo = false;
	dbUtil.sqlUtil = { insertPrice: jest.fn() } as any;
	await dbUtil.insertPrice('price' as any);
	expect(((dbUtil.sqlUtil as any).insertPrice as jest.Mock).mock.calls).toMatchSnapshot();
});

test('readLastPrice', async () => {
	dbUtil.dynamo = false;
	dbUtil.sqlUtil = null;
	try {
		await dbUtil.readLastPrice('quote', 'base');
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamo = true;
	try {
		await dbUtil.readLastPrice('quote', 'base');
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamo = false;
	dbUtil.sqlUtil = { readLastPrice: jest.fn() } as any;
	await dbUtil.readLastPrice('quote', 'base');
	expect(((dbUtil.sqlUtil as any).readLastPrice as jest.Mock).mock.calls).toMatchSnapshot();
});

test('readSourceData', async () => {
	dbUtil.dynamo = false;
	dbUtil.sqlUtil = null;
	try {
		await dbUtil.readSourceData(123, 'quote', 'base');
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamo = true;
	try {
		await dbUtil.readSourceData(123, 'quote', 'base');
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamo = false;
	dbUtil.sqlUtil = { readSourceData: jest.fn() } as any;
	await dbUtil.readSourceData(123, 'quote', 'base');
	expect(((dbUtil.sqlUtil as any).readSourceData as jest.Mock).mock.calls).toMatchSnapshot();
});

test('cleanDB', async () => {
	dbUtil.dynamo = false;
	dbUtil.sqlUtil = null;
	try {
		await dbUtil.cleanDB();
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamo = true;
	try {
		await dbUtil.cleanDB();
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamo = false;
	dbUtil.sqlUtil = { cleanDB: jest.fn() } as any;
	await dbUtil.cleanDB();
	expect((dbUtil.sqlUtil as any).cleanDB as jest.Mock).toBeCalledTimes(1);
});

test('insertHeartbeat', async () => {
	dbUtil.dynamoUtil = null;
	try {
		await dbUtil.insertHeartbeat();
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamoUtil = { insertHeartbeat: jest.fn() } as any;
	await dbUtil.insertHeartbeat();
	await dbUtil.insertHeartbeat('data' as any);
	expect(((dbUtil.dynamoUtil as any).insertHeartbeat as jest.Mock).mock.calls).toMatchSnapshot();
});

test('getPrices', async () => {
	dbUtil.dynamo = false;
	dbUtil.dynamoUtil = null;
	try {
		await dbUtil.getPrices('src', 10, 123, 456, 'pair');
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamo = true;
	try {
		await dbUtil.getPrices('src', 10, 123, 456, 'pair');
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamoUtil = { getPrices: jest.fn() } as any;
	await dbUtil.getPrices('src', 10, 123, 456, 'pair');
	expect(((dbUtil.dynamoUtil as any).getPrices as jest.Mock).mock.calls).toMatchSnapshot();
});

test('addPrice', async () => {
	dbUtil.dynamo = false;
	dbUtil.dynamoUtil = null;
	try {
		await dbUtil.addPrice('price' as any);
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamo = true;
	try {
		await dbUtil.addPrice('price' as any);
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamoUtil = { addPrice: jest.fn() } as any;
	await dbUtil.addPrice('price' as any);
	expect(((dbUtil.dynamoUtil as any).addPrice as jest.Mock).mock.calls).toMatchSnapshot();
});

test('readLastBlock', async () => {
	dbUtil.dynamo = false;
	dbUtil.dynamoUtil = null;
	try {
		await dbUtil.readLastBlock();
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamo = true;
	try {
		await dbUtil.readLastBlock();
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamoUtil = { readLastBlock: jest.fn() } as any;
	await dbUtil.readLastBlock();
	expect(((dbUtil.dynamoUtil as any).readLastBlock as jest.Mock).mock.calls).toMatchSnapshot();
});

test('insertEventsData', async () => {
	dbUtil.dynamo = false;
	dbUtil.dynamoUtil = null;
	try {
		await dbUtil.insertEventsData('events' as any);
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamo = true;
	try {
		await dbUtil.insertEventsData('events' as any);
	} catch (error) {
		expect(error).toBe('invalid');
	}
	dbUtil.dynamoUtil = { insertEventsData: jest.fn() } as any;
	await dbUtil.insertEventsData('events' as any);
	expect(((dbUtil.dynamoUtil as any).insertEventsData as jest.Mock).mock.calls).toMatchSnapshot();
});
