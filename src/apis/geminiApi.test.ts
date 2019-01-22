import tradesRest from '../samples/gemini/tradesRest.json';
import tradesWs from '../samples/gemini/tradesWs.json';
import dbUtil from '../utils/dbUtil';
import httpUtil from '../utils/httpUtil';
import util from '../utils/util';

jest.mock('ws', () =>
	jest.fn().mockImplementation(() => ({
		on: jest.fn(),
		removeAllListeners: jest.fn(),
		terminate: jest.fn()
	}))
);

import api from './geminiApi';
api.init();

let sourcePair = ['ETH', 'USD']
	.sort(() => (api.settings.quoteInversed ? 1 : -1))
	.join(api.settings.separator);
if (api.settings.isLowercase) sourcePair = sourcePair.toLowerCase();
const localCashPair = 'ETH|USD';
api.sourcePairMapping[sourcePair] = localCashPair;

test('fetchTradesREST spot', async () => {
	api.settings.supportWS = false;
	api.last = {};
	api.tradeStatusLastUpdatedAt = {};

	httpUtil.get = jest.fn(() => Promise.resolve(JSON.stringify(tradesRest)));
	dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));

	await api.fetchTradesREST(sourcePair);
	expect((httpUtil.get as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
	const calls = (dbUtil.insertTradeData as jest.Mock<Promise<void>>).mock.calls;
	expect(calls).toMatchSnapshot();
	expect(calls.length).toEqual(tradesRest.length);
});

test('handleWSTradeMessage heartbeat spot', async () => {
	api.settings.supportWS = true;
	api.last = {};
	api.tradeStatusLastUpdatedAt = {};

	dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	api.addTrades = jest.fn();
	const msgTradesWS = { type: 'heartbeat', socket_sequence: 3 };
	await api.handleWSTradeMessage(JSON.stringify(msgTradesWS), sourcePair);
	expect(api.addTrades as jest.Mock).not.toBeCalled();
});

test('handleWSTradeMessage update trade', async () => {
	api.settings.supportWS = true;
	api.last = {};
	api.tradeStatusLastUpdatedAt = {};

	dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));
	api.addTrades = jest.fn();
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	const msgTradesWS = tradesWs;
	await api.handleWSTradeMessage(JSON.stringify(msgTradesWS), sourcePair);
	expect((api.addTrades as jest.Mock).mock.calls).toMatchSnapshot();
});

test('handleWSTradeMessage other type', async () => {
	api.settings.supportWS = true;
	api.last = {};
	api.tradeStatusLastUpdatedAt = {};

	dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));
	api.addTrades = jest.fn();
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	const msgTradesWS = { type: 'other', socket_sequence: 3 };
	await api.handleWSTradeMessage(JSON.stringify(msgTradesWS), sourcePair);
	expect(api.addTrades as jest.Mock).not.toBeCalled();
});

test('fetchTradesWSForPair', async () => {
	api.settings.supportWS = true;
	api.last = {};
	api.tradeStatusLastUpdatedAt = {};
	global.setTimeout = jest.fn();
	api.handleWSTradeMessage = jest.fn();
	const ws = api.fetchTradesWSForPair(sourcePair);

	expect((ws.on as jest.Mock).mock.calls).toMatchSnapshot();
	(ws.on as jest.Mock).mock.calls[0][1]();
	(ws.on as jest.Mock).mock.calls[1][1]('message from ws server');
	expect((api.handleWSTradeMessage as jest.Mock).mock.calls[0]).toMatchSnapshot();

	(ws.on as jest.Mock).mock.calls[2][1]('connection error');
	expect(ws.removeAllListeners as jest.Mock).toBeCalledTimes(1);
	expect(ws.terminate as jest.Mock).toBeCalledTimes(1);
	(ws.on as jest.Mock).mock.calls[3][1]('close');
	expect(ws.removeAllListeners as jest.Mock).toBeCalledTimes(2);
	expect(ws.terminate as jest.Mock).toBeCalledTimes(2);

	expect((global.setTimeout as jest.Mock).mock.calls).toMatchSnapshot();
	api.fetchTradesWSForPair = jest.fn();
	(global.setTimeout as jest.Mock).mock.calls[0][0]();
	(global.setTimeout as jest.Mock).mock.calls[1][0]();
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
	expect(api.fetchTradesWSForPair).toBeCalledTimes(1);
});
