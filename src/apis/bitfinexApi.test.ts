// fix for @ledgerhq/hw-transport-u2f 4.28.0
import '@babel/polyfill';
import tradesRest from '../samples/bitfinex/tradesRest.json';
import tradesWsSnapshot from '../samples/bitfinex/tradesWsSnapshot.json';
import tradesWsUpdate from '../samples/bitfinex/tradesWsUpdate.json';
import dbUtil from '../utils/dbUtil';
import httpUtil from '../utils/httpUtil';
import util from '../utils/util';
import api from './bitfinexApi';

jest.mock('bitfinex-api-node', () =>
	jest.fn().mockImplementation(() => ({
		ws: {
			on: jest.fn(),
			subscribeTrades: jest.fn(),
			close: jest.fn()
		}
	}))
);

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
	dbUtil.insertTradeData = jest.fn(() => Promise.resolve());

	await api.fetchTradesREST(sourcePair);
	expect((httpUtil.get as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
	const calls = (dbUtil.insertTradeData as jest.Mock<Promise<void>>).mock.calls;
	expect(calls).toMatchSnapshot();
	expect(calls.length).toEqual(tradesRest.length);
});

test('fetchTradesREST spot with last localPair', async () => {
	api.settings.supportWS = false;
	api.last = {};
	api.tradeStatusLastUpdatedAt = {};

	httpUtil.get = jest.fn(() => Promise.resolve(JSON.stringify(tradesRest)));
	dbUtil.insertTradeData = jest.fn(() => Promise.resolve());
	api.last[localCashPair] = '1234567890';
	await api.fetchTradesREST(sourcePair);
	expect((httpUtil.get as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
	const calls = (dbUtil.insertTradeData as jest.Mock<Promise<void>>).mock.calls;
	expect(calls).toMatchSnapshot();
	expect(calls.length).toEqual(tradesRest.length);
});

test('handleWSTradeMessage spot', async () => {
	api.settings.supportWS = true;
	api.last = {};
	api.tradeStatusLastUpdatedAt = {};

	dbUtil.insertTradeData = jest.fn(() => Promise.resolve());
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	const msgTradesWS = [
		tradesWsSnapshot,
		tradesWsUpdate,
		{ seq: '13224213-ETHBTC', timestamp: 1535617645, price: 0.040479, amount: 0.21911125 } //'te
	];
	for (const m of msgTradesWS) await api.handleWSTradeMessage(JSON.stringify(m), sourcePair);

	const calls = (dbUtil.insertTradeData as jest.Mock<Promise<void>>).mock.calls;
	expect(calls).toMatchSnapshot();
	expect(calls.length).toEqual(1);
});

test(`fetchTrades WS `, async () => {
	api.settings.supportWS = true;
	api.settings.wsLink = 'bitfinexWsLink';

	api.handleWSTradeOpen = jest.fn();
	api.handleWSTradeMessage = jest.fn();
	global.setTimeout = jest.fn();
	const w = api.fetchTradesWS([`quote-base`]);
	expect((w.on as jest.Mock).mock.calls).toMatchSnapshot();
	(w.on as jest.Mock).mock.calls[0][1]();

	expect((w.subscribeTrades as jest.Mock).mock.calls).toMatchSnapshot();
	(w.on as jest.Mock).mock.calls[1][1]('symbol', '{price: 1, id: 1234, amount: 12}');
	expect((api.handleWSTradeMessage as jest.Mock).mock.calls).toMatchSnapshot();

	(w.on as jest.Mock).mock.calls[2][1](202, 'close reason');
	expect(w.close as jest.Mock).toBeCalledTimes(1);
	(w.on as jest.Mock).mock.calls[3][1]('error');
	expect(w.close as jest.Mock).toBeCalledTimes(2);

	expect((global.setTimeout as jest.Mock).mock.calls).toMatchSnapshot();
	api.fetchTradesWS = jest.fn();
	(global.setTimeout as jest.Mock).mock.calls[0][0]();
	(global.setTimeout as jest.Mock).mock.calls[1][0]();
	expect((api.fetchTradesWS as jest.Mock).mock.calls).toMatchSnapshot();
});
