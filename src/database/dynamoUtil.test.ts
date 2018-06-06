// import * as CST from '../constants';
import util from '../util';
import dynamoUtil from './dynamoUtil';
const sampleTrades = require('../samples/dynamoTrades.json');
const sampleMinutely = require('../samples/dynamoMinutely.json');

const trade = {
	source: 'src',
	id: 'id',
	price: 123,
	amount: 456,
	timestamp: 1234567890
};

const priceBar = {
	source: 'src',
	date: 'YYYY-MM-DD',
	hour: '00',
	minute: 0,
	open: 1,
	high: 3,
	low: 0,
	close: 2,
	volume: 123,
	timestamp: 1234567890
};

const event = {
	type: 'type',
	id: 'id',
	blockHash: 'blockHash',
	blockNumber: 123,
	transactionHash: 'txHash',
	logStatus: 'logStatus',
	parameters: {
		test: 'test'
	},
	timestamp: 1234567890,
}

test('connection initalization', () =>
	dynamoUtil.insertData({} as any).catch(error => expect(error).toMatchSnapshot()));

test('convertTradeToDynamo', () =>
	expect(dynamoUtil.convertTradeToDynamo(trade, 123)).toMatchSnapshot());

test('convertTradeToDynamo', () =>
	expect(
		dynamoUtil.convertPriceToDynamo({
			price: 123,
			timestamp: 1234567890,
			volume: 456
		})
	).toMatchSnapshot());

test('convertPriceBarToDynamo', () =>
	expect(dynamoUtil.convertPriceBarToDynamo(priceBar)).toMatchSnapshot());

test('convertEventToDynamo', () =>
	expect(dynamoUtil.convertEventToDynamo(event, 9876543210)).toMatchSnapshot());

test('insertTradeData', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	util.getNowTimestamp = jest.fn(() => 0);
	await dynamoUtil.insertTradeData(trade, true);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(2);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
});

test('insertMinutelyData', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	await dynamoUtil.insertMinutelyData(priceBar);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('insertHourlyData', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	await dynamoUtil.insertHourlyData(priceBar);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('insertEventData', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	await dynamoUtil.insertEventData([event]);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('insertHeartbeat', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	await dynamoUtil.insertHeartbeat();
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('insertStatusData', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	await dynamoUtil.insertStatusData({ test: 'test' });
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('readTradeData', async () => {
	dynamoUtil.queryData = jest.fn(() => Promise.resolve(sampleTrades));
	expect(await dynamoUtil.readTradeData('source', 'datetime')).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('readMinutelyData', async () => {
	dynamoUtil.queryData = jest.fn(() => Promise.resolve(sampleMinutely));
	expect(await dynamoUtil.readMinutelyData('source', 'datetime')).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});
