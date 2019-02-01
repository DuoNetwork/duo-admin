// fix for @ledgerhq/hw-transport-u2f 4.28.0
import '@babel/polyfill';
import { IPrice } from '@finbook/duo-market-data';
import SqlUtil from './sqlUtil';
import util from './util';

let connError = '';
jest.mock('mysql', () => ({
	createConnection: jest.fn(() => ({
		on: jest.fn(),
		connect: jest.fn(cb => cb(connError))
	}))
}));

import * as mysql from 'mysql';

const dynamoMock = {
	convertTradeToDynamo: jest.fn(),
	insertStatusData: jest.fn()
};
const sqlUtil = new SqlUtil('host', 'user', 'pwd', dynamoMock as any);

test('constructor', () => {
	expect(sqlUtil.conn).toBeTruthy();
	expect((mysql.createConnection as jest.Mock).mock.calls).toMatchSnapshot();
	expect(sqlUtil.dynamoUtil).toBe(dynamoMock);
});

test('init', async () => {
	await sqlUtil.init()
	expect(((sqlUtil.conn as any).on as jest.Mock).mock.calls).toMatchSnapshot();
	connError = 'connError';
	try {
		await sqlUtil.init();
	} catch (error) {
		expect(error).toBe(connError);
	}
	sqlUtil.init = jest.fn();
	expect(() => ((sqlUtil.conn as any).on as jest.Mock).mock.calls[0][1]('error')).toThrow();
	((sqlUtil.conn as any).on as jest.Mock).mock.calls[0][1]({ code: 'PROTOCOL_CONNECTION_LOST' });
	expect(sqlUtil.init as jest.Mock).toBeCalledTimes(1)
});

test('executeQuery error', async () => {
	const mock = jest.fn((sqlQuery: string, cb: any) => cb(sqlQuery));
	sqlUtil.conn = {
		query: mock
	} as any;
	try {
		await sqlUtil.executeQuery('test');
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('executeQuery error ER_DUP_ENTRY', async () => {
	const mock = jest.fn((sqlQuery: string, cb: any) => cb({ code: 'ER_DUP_ENTRY' }, sqlQuery));
	sqlUtil.conn = {
		query: mock
	} as any;
	try {
		await sqlUtil.executeQuery('test');
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('executeQuery', async () => {
	const mock = jest.fn((sqlQuery: string, cb: any) => cb('', sqlQuery));
	sqlUtil.conn = {
		query: mock
	} as any;
	expect(await sqlUtil.executeQuery('test')).toBe('test');
});

test('insertTradeData', async () => {
	sqlUtil.executeQuery = jest.fn(() => Promise.resolve());
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	await sqlUtil.insertTradeData(
		{
			quote: 'quote',
			base: 'base',
			source: 'src',
			id: 'id',
			price: 123,
			amount: 456,
			timestamp: 1234567890
		},
		true
	);
	await sqlUtil.insertTradeData(
		{
			quote: 'quote',
			base: 'base',
			source: 'src',
			id: 'id',
			price: 123,
			amount: 456,
			timestamp: 0
		},
		false
	);
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
	expect(dynamoMock.insertStatusData).toBeCalledTimes(1);
	expect(dynamoMock.convertTradeToDynamo.mock.calls).toMatchSnapshot();
});

test('insertPrice', async () => {
	sqlUtil.executeQuery = jest.fn(() => Promise.resolve());
	await sqlUtil.insertPrice({
		price: 123,
		volume: 456,
		timestamp: 1234567890,
		source: '',
		base: 'USD',
		quote: 'ETH'
	});
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('readLastPrice', async () => {
	sqlUtil.executeQuery = jest.fn(() => Promise.resolve([]));
	expect(await sqlUtil.readLastPrice('ETH', 'USD')).toMatchSnapshot();
	sqlUtil.executeQuery = jest.fn(() =>
		Promise.resolve([
			{
				price: '123',
				volume: '456',
				timestamp: '1234567890'
			}
		])
	);
	expect(await sqlUtil.readLastPrice('ETH', 'USD')).toMatchSnapshot();
	expect((sqlUtil.executeQuery as jest.Mock<Promise<IPrice[]>>).mock.calls).toMatchSnapshot();
});

test('readSourceData', async () => {
	sqlUtil.executeQuery = jest.fn(() =>
		Promise.resolve([
			{
				source: 'src1',
				id: 'id1',
				price: '123',
				amount: '456',
				timestamp: '1234567890'
			},
			{
				source: 'src2',
				id: 'id2',
				price: '234',
				amount: '567',
				timestamp: '2345678901'
			}
		])
	);
	const trades = await sqlUtil.readSourceData(1234567890, 'ETH', 'USD');
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect(trades).toMatchSnapshot();
});

test('cleanDB', async () => {
	sqlUtil.executeQuery = jest.fn(() => Promise.resolve());
	await sqlUtil.cleanDB();
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});
