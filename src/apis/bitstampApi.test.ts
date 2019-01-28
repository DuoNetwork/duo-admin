import Pusher from 'pusher-js';
import tradesRest from '../samples/bitstamp/tradesRest.json';
import tradesWs from '../samples/bitstamp/tradesWs.json';
import dbUtil from '../utils/dbUtil';
import httpUtil from '../utils/httpUtil';
import util from '../utils/util';
import api from './bitstampApi';

jest.mock('pusher-js', () =>
	jest.fn().mockImplementation(() => ({
		bind: jest.fn(),
		subscribe: jest.fn(),
		connection: {
			bind: jest.fn()
		},
		disconnect: jest.fn()
	}))
);

api.init();

let sourcePair = ['ETH', 'USD']
	.sort(() => (api.settings.quoteInversed ? 1 : -1))
	.join(api.settings.separator);
if (api.settings.isLowercase) sourcePair = sourcePair.toLowerCase();
const localCashPair = 'ETH|USD';
api.sourcePairMapping[sourcePair] = localCashPair;

let testCases: { [key: string]: any };
testCases = {
	'fetchTradesREST spot': {
		sourceInstrument: sourcePair,
		tradesRest: tradesRest
	}
};
for (const testName in testCases) {
	const testCase = testCases[testName];
	test(testName, async () => {
		api.settings.supportWS = false;
		api.last = {};
		api.tradeStatusLastUpdatedAt = {};

		httpUtil.get = jest.fn(() => Promise.resolve(JSON.stringify(tradesRest)));
		dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));

		await api.fetchTradesREST(testCase.sourceInstrument);
		expect((httpUtil.get as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
		const calls = (dbUtil.insertTradeData as jest.Mock<Promise<void>>).mock.calls;
		expect(calls).toMatchSnapshot();
		expect(calls.length).toEqual(testCase.tradesRest.length);
	});

	test(testName + 'with last localPair', async () => {
		api.settings.supportWS = false;
		api.last = {};
		api.tradeStatusLastUpdatedAt = {};

		httpUtil.get = jest.fn(() => Promise.resolve(JSON.stringify(testCase.tradesRest)));
		dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));
		api.last[localCashPair] = '1234567890';
		await api.fetchTradesREST(testCase.sourceInstrument);
		expect((httpUtil.get as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
		const calls = (dbUtil.insertTradeData as jest.Mock<Promise<void>>).mock.calls;
		expect(calls).toMatchSnapshot();
		expect(calls.length).toEqual(testCase.tradesRest.length);
	});
}

testCases = {
	'handleWSTradeMessage spot': {
		sourceInstrument: sourcePair,
		msgTradesWS: [tradesWs]
	}
};
for (const testName in testCases) {
	const testCase = testCases[testName];
	test(testName, async () => {
		api.settings.supportWS = true;
		api.last = {};
		api.tradeStatusLastUpdatedAt = {};

		dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));
		util.getUTCNowTimestamp = jest.fn(() => 1234567890);

		for (const m of testCase.msgTradesWS)
			await api.handleWSTradeMessage(JSON.stringify(m), testCase.sourceInstrument);
		const calls = (dbUtil.insertTradeData as jest.Mock<Promise<void>>).mock.calls;
		expect(calls).toMatchSnapshot();
		expect(calls.length).toEqual(1);
	});
}

test(`fetchTradesWSForPair `, async () => {
	api.settings.supportWS = true;
	api.settings.wsLink = 'bitstampWsLink';

	api.handleWSTradeMessage = jest.fn();
	global.setTimeout = jest.fn();
	const socket = api.fetchTradesWSForPair(`quote-base`);
	expect((Pusher as any).mock.calls).toMatchSnapshot();
	expect((socket.bind as jest.Mock).mock.calls).toMatchSnapshot();
	expect((socket.connection.bind as jest.Mock).mock.calls).toMatchSnapshot();

	(socket.bind as jest.Mock).mock.calls[0][1]({ price: 1, id: 1234, amount: 12 });
	expect((api.handleWSTradeMessage as jest.Mock).mock.calls).toMatchSnapshot();

	(socket.connection.bind as jest.Mock).mock.calls[0][1]({
		error: {
			data: {
				code: 4004
			}
		}
	});
	expect(socket.disconnect as jest.Mock).toBeCalledTimes(1);

	(socket.connection.bind as jest.Mock).mock.calls[0][1]({
		error: {
			data: {
				code: 4000
			}
		}
	});
	expect(socket.disconnect as jest.Mock).toBeCalledTimes(2);

	(socket.connection.bind as jest.Mock).mock.calls[1][1]();
	expect(socket.disconnect as jest.Mock).toBeCalledTimes(2);

	expect((global.setTimeout as jest.Mock).mock.calls).toMatchSnapshot();
	api.fetchTradesWSForPair = jest.fn();
	(global.setTimeout as jest.Mock).mock.calls[0][0]();
	(global.setTimeout as jest.Mock).mock.calls[1][0]();
	(global.setTimeout as jest.Mock).mock.calls[2][0]();
	expect((api.fetchTradesWSForPair as jest.Mock).mock.calls).toMatchSnapshot();
});

test('fetchTradesWS', async () => {
	api.settings.supportWS = true;
	api.last = {};
	api.tradeStatusLastUpdatedAt = {};
	global.setTimeout = jest.fn();
	api.handleWSTradeMessage = jest.fn();
	api.fetchTradesWSForPair = jest.fn();
	api.fetchTradesWS([sourcePair]);
	expect((api.fetchTradesWSForPair as jest.Mock).mock.calls).toMatchSnapshot();
});
