import AWS from 'aws-sdk/global';
import moment from 'moment';
import * as CST from '../common/constants';
import { IEvent } from '../common/types';
import conversion from '../samples/dynamo/conversion.json';
import prices from '../samples/dynamo/prices.json';
import status from '../samples/dynamo/status.json';
import totalSupply from '../samples/dynamo/totalSupply.json';
import uiCreate from '../samples/dynamo/uiCreate.json';
import uiRedeem from '../samples/dynamo/uiRedeem.json';
import events from '../samples/events.json';
import dynamoUtil from './dynamoUtil';
import util from './util';

jest.mock('aws-sdk/clients/dynamodb', () => jest.fn().mockImplementation(() => ({})));
jest.mock('aws-sdk/global', () => ({
	config: {
		update: jest.fn()
	}
}));

test('init', async () => {
	await dynamoUtil.init('config' as any, true, 'process', () => 0, () => ({} as any));
	expect(dynamoUtil.ddb).toBeTruthy();
	expect(dynamoUtil.live).toBeTruthy();
	expect(dynamoUtil.process).toBe('process');
	expect((AWS.config.update as jest.Mock).mock.calls).toMatchSnapshot();
});

test('insertData no ddb', async () => {
	dynamoUtil.ddb = undefined;
	try {
		await dynamoUtil.insertData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('queryData no ddb', async () => {
	try {
		await dynamoUtil.queryData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('scanData no ddb', async () => {
	try {
		await dynamoUtil.scanData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('deleteData no ddb', async () => {
	try {
		await dynamoUtil.deleteData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('insertData error', async () => {
	const mock = jest.fn((params: any, cb: any) => cb(params));
	dynamoUtil.ddb = {
		putItem: mock
	} as any;
	try {
		await dynamoUtil.insertData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('queryData error', async () => {
	const mock = jest.fn((params: any, cb: any) => cb(params));
	dynamoUtil.ddb = {
		query: mock
	} as any;
	try {
		await dynamoUtil.queryData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('scanData error', async () => {
	const mock = jest.fn((params: any, cb: any) => cb(params));
	dynamoUtil.ddb = {
		scan: mock
	} as any;
	try {
		await dynamoUtil.scanData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('deleteData error', async () => {
	const mock = jest.fn((params: any, cb: any) => cb(params));
	dynamoUtil.ddb = {
		deleteItem: mock
	} as any;
	try {
		await dynamoUtil.deleteData({} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('insertData', async () => {
	const mock = jest.fn((params: any, cb: any) => params && cb());
	dynamoUtil.ddb = {
		putItem: mock
	} as any;
	await dynamoUtil.insertData({} as any);
	expect(mock.mock.calls).toMatchSnapshot();
});

test('queryData', async () => {
	const mock = jest.fn((params: any, cb: any) => params && cb());
	dynamoUtil.ddb = {
		query: mock
	} as any;
	await dynamoUtil.queryData({} as any);
	expect(mock.mock.calls).toMatchSnapshot();
});

test('scanData', async () => {
	const mock = jest.fn((params: any, cb: any) => params && cb());
	dynamoUtil.ddb = {
		scan: mock
	} as any;
	await dynamoUtil.scanData({} as any);
	expect(mock.mock.calls).toMatchSnapshot();
});

test('deleteData', async () => {
	const mock = jest.fn((params: any, cb: any) => params && cb());
	dynamoUtil.ddb = {
		deleteItem: mock
	} as any;
	await dynamoUtil.deleteData({} as any);
	expect(mock.mock.calls).toMatchSnapshot();
});

test('getPriceKeyField', () => {
	expect(dynamoUtil.getPriceKeyField(0)).toBe(CST.DB_SRC_DHM);
	expect(dynamoUtil.getPriceKeyField(1)).toBe(CST.DB_SRC_DH);
	expect(dynamoUtil.getPriceKeyField(60)).toBe(CST.DB_SRC_DATE);
	expect(() => dynamoUtil.getPriceKeyField(2)).toThrowErrorMatchingSnapshot();
});

const trade = {
	quote: 'quote',
	base: 'base',
	source: 'src',
	id: 'id',
	price: 123,
	amount: 456,
	timestamp: 1234567890
};

test('connection initalization', () =>
	dynamoUtil.insertData({} as any).catch(error => expect(error).toMatchSnapshot()));

test('insertStatusData', async () => {
	dynamoUtil.live = false;
	dynamoUtil.insertData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.insertStatusData({ test: 'test' });
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('insertStatusData error', async () => {
	dynamoUtil.live = true;
	dynamoUtil.insertData = jest.fn(() => Promise.reject());
	await dynamoUtil.insertStatusData({ test: 'test' });
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('convertTradeToDynamo', () =>
	expect(dynamoUtil.convertTradeToDynamo(trade, 123)).toMatchSnapshot());

test('convertEventToDynamo', () =>
	(events as IEvent[]).forEach(event =>
		expect(dynamoUtil.convertEventToDynamo(event, 9876543210)).toMatchSnapshot()
	));

test('insertTradeData', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	util.getUTCNowTimestamp = jest.fn(() => 0);
	await dynamoUtil.insertTradeData(trade, true);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(2);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
});

test('insertTradeData dev', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	util.getUTCNowTimestamp = jest.fn(() => 0);
	dynamoUtil.live = false;
	await dynamoUtil.insertTradeData(trade, true);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(2);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
});

test('insertTradeData insertStatus', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	util.getUTCNowTimestamp = jest.fn(() => 0);
	dynamoUtil.live = false;
	dynamoUtil.insertStatusData = jest.fn();
	await dynamoUtil.insertTradeData(trade, false);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect(dynamoUtil.insertStatusData as jest.Mock).not.toBeCalled();
});

test('insertEventsData', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.insertEventsData(events);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(
		events.length
	);
	const mockCalls = (dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls;
	for (const call of mockCalls) expect(call[0]).toMatchSnapshot();
});

test('insertEventsData live', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve({}));
	dynamoUtil.live = true;
	await dynamoUtil.insertEventsData(events);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(
		events.length
	);
	const mockCalls = (dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls;
	for (const call of mockCalls) expect(call[0]).toMatchSnapshot();
});

test('insertHeartbeat', async () => {
	dynamoUtil.live = false;
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	await dynamoUtil.insertHeartbeat();
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('insertHeartbeat error', async () => {
	dynamoUtil.live = true;
	dynamoUtil.insertData = jest.fn(() => Promise.reject());
	await dynamoUtil.insertHeartbeat({});
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('readLastBlock, dev', async () => {
	dynamoUtil.live = false;
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [
				{
					block: {
						N: 1000000
					}
				}
			]
		})
	);
	expect(await dynamoUtil.readLastBlock()).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('readLastBlock', async () => {
	dynamoUtil.live = true;
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [
				{
					block: {
						N: 1000000
					}
				}
			]
		})
	);
	expect(await dynamoUtil.readLastBlock()).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('readLastBlock, no Item', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: []
		})
	);
	expect(await dynamoUtil.readLastBlock()).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

const dynamoTrade = {
	price: {
		N: 100
	},
	quoteBaseId: {
		S: 'quote|Base|Id'
	},
	sourceDateHourMinute: {
		S: 'source|2018-10-01|01|01'
	},
	timestamp: {
		N: 1234567890000
	},
	amount: {
		N: 12
	}
};
test('getSingleKeyPeriodPrices, period = 0', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [dynamoTrade]
		})
	);
	expect(
		await dynamoUtil.getSingleKeyPeriodPrices('source', 0, 1234567890000, 'quote|base')
	).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('getSingleKeyPeriodPrices, no data', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: []
		})
	);
	expect(
		(await dynamoUtil.getSingleKeyPeriodPrices('source', 0, 1234567890000, 'quote|base')).length
	).toBe(0);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('getSingleKeyPeriodPrices, dev', async () => {
	dynamoUtil.live = false;
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [
				{
					price: {
						N: 100
					},
					quoteBaseId: {
						S: ''
					},
					sourceDateHourMinute: {
						S: ''
					},
					timestamp: {
						N: 1234567890000
					},
					amount: {
						N: 12
					}
				}
			]
		})
	);
	expect(
		await dynamoUtil.getSingleKeyPeriodPrices('source', 0, 1234567890000, 'quote|base')
	).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('getSingleKeyPeriodPrices, period = 0, no pair', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [dynamoTrade]
		})
	);
	expect(await dynamoUtil.getSingleKeyPeriodPrices('source', 0, 1234567890000)).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

const dynamoPrice1 = {
	sourceDateHour: {
		S: 'source|2018-10-01|01'
	},
	base: {
		S: 'base'
	},
	quote: {
		S: 'quote'
	},
	quoteBaseTimestamp: {
		S: 'quote|base|1234567890000'
	},
	open: {
		N: 100
	},
	high: {
		N: 120
	},
	low: {
		N: 80
	},
	close: {
		N: 110
	},
	volume: {
		N: 20000
	}
};
test('getSingleKeyPeriodPrices, period = 1', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [dynamoPrice1]
		})
	);
	expect(
		await dynamoUtil.getSingleKeyPeriodPrices('source', 1, 1234567890000, 'quote|base')
	).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('getSingleKeyPeriodPrices, dev', async () => {
	dynamoUtil.live = true;
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [dynamoPrice1]
		})
	);
	expect(
		await dynamoUtil.getSingleKeyPeriodPrices('source', 1, 1234567890000, 'quote|base')
	).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('getSingleKeyPeriodPrices, period = 60', async () => {
	const dynamoPrice = {
		sourceDate: {
			S: ''
		},
		base: {
			S: ''
		},
		quote: {
			S: ''
		},
		quoteBaseTimestamp: {
			S: ''
		},
		open: {
			N: 100
		},
		high: {
			N: 120
		},
		low: {
			N: 80
		},
		close: {
			N: 110
		},
		volume: {
			N: 20000
		}
	};
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [dynamoPrice]
		})
	);
	expect(
		await dynamoUtil.getSingleKeyPeriodPrices('source', 60, 1234567890000, 'quote|base')
	).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('getSingleKeyPeriodPrices, period > 60', async () => {
	dynamoUtil.getPriceKeyField = jest.fn(() => 'key');
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [{}]
		})
	);
	try {
		await dynamoUtil.getSingleKeyPeriodPrices('source', 120, 1234567890000, 'quote|base');
	} catch (err) {
		expect(err).toMatchSnapshot();
	}
});

test('getSingleKeyPeriodPrices, period invalid', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [{}]
		})
	);
	try {
		await dynamoUtil.getSingleKeyPeriodPrices('source', 40, 1234567890000, 'quote|base');
	} catch (err) {
		expect(err).toMatchSnapshot();
	}
});

const tradeData = {
	quoteBaseId: {
		S: 'quote|base|Id'
	},
	price: {
		N: 120
	},
	amount: {
		N: 10
	},
	sourceDateHourMinute: {
		S: '2018-10-01|01|01'
	},
	pair: {
		S: 'quote|base'
	},
	timestamp: {
		N: 1234567890000
	}
};
test('getTrades', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [tradeData]
		})
	);
	expect(
		await dynamoUtil.getTrades('source', '2018-10-01|01|01', 'quote|base')
	).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('getTrades, no pair', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [tradeData]
		})
	);
	expect(await dynamoUtil.getTrades('source', '2018-10-01|01|01')).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('getTrades, no pair', async () => {
	dynamoUtil.live = false;
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [tradeData]
		})
	);
	expect(await dynamoUtil.getTrades('source', '2018-10-01|01|01')).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('getTrades, no trade', async () => {
	dynamoUtil.live = false;
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: []
		})
	);
	expect((await dynamoUtil.getTrades('source', '2018-10-01|01|01')).length).toBe(0);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('getTrades, invalid type', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [
				{
					quoteBaseId: {
						S: ''
					},
					price: {
						N: 120
					},
					amount: {
						N: 10
					},
					sourceDateHourMinute: {
						S: ''
					},
					pair: {
						S: ''
					},
					timestamp: {
						N: 1234567890000
					}
				}
			]
		})
	);
	expect(
		await dynamoUtil.getTrades('source', '2018-10-01|01|01', 'quote|base')
	).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('scanStatus', async () => {
	dynamoUtil.scanData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.scanStatus();
	expect((dynamoUtil.scanData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.scanData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('scanStatus, live', async () => {
	dynamoUtil.live = true;
	dynamoUtil.scanData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.scanStatus();
	expect((dynamoUtil.scanData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.scanData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

const convertedStatus = dynamoUtil.parseStatus(status);
test('parseStatus', () => expect(convertedStatus).toMatchSnapshot());

test('queryAcceptPriceEvent', async () => {
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryAcceptPriceEvent(CST.DUMMY_ADDR, ['date1', 'date2']);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(2);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
});

test('queryAcceptPriceEvent, dev', async () => {
	dynamoUtil.live = false;
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryAcceptPriceEvent(CST.DUMMY_ADDR, ['date1', 'date2']);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(2);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
});

test('parseAcceptedPrices', () => expect(dynamoUtil.parseAcceptedPrice(prices)).toMatchSnapshot());
test('parseAcceptedPrices, invalid type', () =>
	expect(
		dynamoUtil.parseAcceptedPrice({
			Items: [
				{
					timeInSecond: { S: '1529625600' },
					sender: { S: '0x00476E55e02673B0E4D2B474071014D5a366Ed4E' },
					eventKey: {
						S: ''
					},
					navAInWei: { S: '' },
					timestampId: { S: '1529625612000|log_f7abca98' },
					blockNumber: { N: '7722428' },
					logStatus: { S: 'mined' },
					systime: { N: '1529625989069' },
					priceInWei: { S: '' },
					navBInWei: { S: '' },
					blockHash: {
						S: '0xdb41c94c37dad7feb9959c98c70bdaecb82022dd2484d27188452d559cd71eb5'
					},
					transactionHash: {
						S: ''
					}
				}
			]
		})
	).toMatchSnapshot());
test('parseAcceptedPrices, invalid type', () =>
	expect(
		dynamoUtil.parseAcceptedPrice({
			Items: [
				{
					timeInSecond: { S: '1529625600' },
					sender: { S: '0x00476E55e02673B0E4D2B474071014D5a366Ed4E' },
					eventKey: {
						S: ''
					},
					// navAInWei: { S: '' },
					timestampId: { S: '1529625612000|log_f7abca98' },
					blockNumber: { N: '7722428' },
					logStatus: { S: 'mined' },
					systime: { N: '1529625989069' },
					priceInWei: { S: '' },
					// navBInWei: { S: '' },
					blockHash: {
						S: '0xdb41c94c37dad7feb9959c98c70bdaecb82022dd2484d27188452d559cd71eb5'
					},
					transactionHash: {
						S: ''
					}
				}
			]
		})
	).toMatchSnapshot());

test('queryConversionEvent', async () => {
	dynamoUtil.live = true;
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryConversionEvent(CST.DUMMY_ADDR, CST.DUMMY_ADDR, ['date1', 'date2']);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(4);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[2][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[3][0]).toMatchSnapshot();
});

test('queryConversionEvent, dev', async () => {
	dynamoUtil.live = false;
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryConversionEvent(CST.DUMMY_ADDR, CST.DUMMY_ADDR, ['date1', 'date2']);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(4);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[2][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[3][0]).toMatchSnapshot();
});

test('parseConversion', () => expect(dynamoUtil.parseConversion(conversion)).toMatchSnapshot());

test('queryTotalSupplyEvent, live', async () => {
	dynamoUtil.live = true;
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryTotalSupplyEvent(CST.DUMMY_ADDR, ['date1', 'date2']);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(2);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
});

test('queryTotalSupplyEvent', async () => {
	dynamoUtil.live = false;
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryTotalSupplyEvent(CST.DUMMY_ADDR, ['date1', 'date2']);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(2);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
});

test('parseTotalSupply', () => expect(dynamoUtil.parseTotalSupply(totalSupply)).toMatchSnapshot());

test('queryUIConversionEvent', async () => {
	dynamoUtil.queryData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.queryUIConversionEvent(CST.DUMMY_ADDR, CST.DUMMY_ADDR);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls.length).toBe(2);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
});

const uiConversionData = {
	eventKey: {
		S: 'eventKey'
	},

	transactionHash: {
		S: 'txHash'
	},
	systime: {
		N: 1234567890000
	},
	eth: {
		N: 12
	},
	tokenA: {
		N: 12
	},
	tokenB: {
		N: 12
	},
	fee: {
		N: 1
	}
};

test('queryUIConversionEvent, status', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [uiConversionData]
		})
	);

	await dynamoUtil.queryUIConversionEvent(CST.DUMMY_ADDR, CST.DUMMY_ADDR);
});

test('queryUIConversionEvent, status', async () => {
	dynamoUtil.live = true;
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [uiConversionData]
		})
	);

	await dynamoUtil.queryUIConversionEvent(CST.DUMMY_ADDR, CST.DUMMY_ADDR);
});

test('queryUIConversionEvent, status', async () => {
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: [uiConversionData]
		})
	);
	dynamoUtil.getTxStatus = jest.fn(() => Promise.reject('getStatus error!'));
	try {
		await dynamoUtil.queryUIConversionEvent(CST.DUMMY_ADDR, CST.DUMMY_ADDR);
	} catch (err) {
		util.logError(JSON.stringify(err));
	}
});

test('parseUIConversion', () => {
	expect(dynamoUtil.parseUIConversion(uiCreate)).toMatchSnapshot();
	expect(dynamoUtil.parseUIConversion(uiRedeem)).toMatchSnapshot();
});

test('getPrices', async () => {
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);

	const start = moment.utc('20181007T235800').valueOf();
	const end = moment.utc('20181008T001000').valueOf();
	dynamoUtil.getSingleKeyPeriodPrices = jest.fn(() =>
		Promise.resolve([
			{
				source: 'bitfinex',
				base: 'USD',
				quote: 'ETH',
				timestamp: start,
				period: 0,
				open: 220.10002,
				high: 220.10002,
				low: 220.10002,
				close: 220.10002,
				volume: 0.0007
			},
			{
				source: 'bitfinex',
				base: 'USD',
				quote: 'ETH',
				timestamp: start,
				period: 0,
				open: 220.10002,
				high: 220.10002,
				low: 220.10002,
				close: 220.10002,
				volume: 17.6757
			},
			{
				source: 'bitfinex',
				base: 'USD',
				quote: 'ETH',
				timestamp: start,
				period: 0,
				open: 202.12,
				high: 202.12,
				low: 202.12,
				close: 202.12,
				volume: 0.0013
			}
		])
	);
	await dynamoUtil.getPrices('anySrc', 1, start);
	await dynamoUtil.getPrices('anySrc', 1, start, end);
	await dynamoUtil.getPrices('anySrc', 1, start, end, 'ETH|USD');
	await dynamoUtil.getPrices('anySrc', 60, start, end);
	expect(
		(dynamoUtil.getSingleKeyPeriodPrices as jest.Mock<Promise<void>>).mock.calls
	).toMatchSnapshot();
});

const price = {
	source: 'source',
	base: 'base',
	quote: 'quote',
	timestamp: 1234567890,
	period: 1,
	open: 2,
	high: 4,
	low: 0,
	close: 3,
	volume: 5
};

test('addPrice', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve({}));
	await dynamoUtil.addPrice(price);
	price.period = 10;
	await dynamoUtil.addPrice(price);
	price.period = 60;
	await dynamoUtil.addPrice(price);
	price.period = 360;
	await dynamoUtil.addPrice(price);
	price.period = 1440;
	await dynamoUtil.addPrice(price);
	price.period = 1440;
	dynamoUtil.live = false;
	await dynamoUtil.addPrice(price);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
	price.period = 40;
	try {
		await dynamoUtil.addPrice(price);
	} catch (err) {
		expect(err).toMatchSnapshot();
	}
});

test('insertUIConversion', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	await dynamoUtil.insertUIConversion(
		CST.DUMMY_ADDR,
		CST.DUMMY_ADDR,
		'0x123',
		true,
		123,
		456,
		456,
		0.123
	);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('insertUIConversion, live', async () => {
	dynamoUtil.live = true;
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	await dynamoUtil.insertUIConversion(
		CST.DUMMY_ADDR,
		CST.DUMMY_ADDR,
		'0x123',
		false,
		123,
		456,
		456,
		0.123
	);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('deleteUIConversionEvent', async () => {
	dynamoUtil.deleteData = jest.fn(() => Promise.resolve());
	await dynamoUtil.deleteUIConversionEvent(CST.DUMMY_ADDR, {
		contractAddress: 'contractAddress',
		type: 'type',
		transactionHash: 'txHash',
		eth: 0,
		tokenA: 0,
		tokenB: 0,
		timestamp: 0,
		blockNumber: 0,
		fee: 0
	});
	expect((dynamoUtil.deleteData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('deleteUIConversionEvent, dev', async () => {
	dynamoUtil.live = false;
	dynamoUtil.deleteData = jest.fn(() => Promise.resolve());
	await dynamoUtil.deleteUIConversionEvent(CST.DUMMY_ADDR, {
		contractAddress: 'contractAddress',
		type: 'type',
		transactionHash: 'txHash',
		eth: 0,
		tokenA: 0,
		tokenB: 0,
		timestamp: 0,
		blockNumber: 0,
		fee: 0
	});
	expect((dynamoUtil.deleteData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('getSingleKeyPeriodPrices', async () => {
	util.getUTCNowTimestamp = jest.fn(() => 9876543210);
	dynamoUtil.queryData = jest.fn(() =>
		Promise.resolve({
			Items: []
		})
	);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 0, 1234567890);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 0, 1234567890, 'quote|base');
	await dynamoUtil.getSingleKeyPeriodPrices('src', 1, 1234567890);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 1, 1234567890, 'quote|base');
	await dynamoUtil.getSingleKeyPeriodPrices('src', 10, 1234567890);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 60, 1234567890);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 360, 1234567890);
	await dynamoUtil.getSingleKeyPeriodPrices('src', 1440, 1234567890);
	expect((dynamoUtil.queryData as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});
