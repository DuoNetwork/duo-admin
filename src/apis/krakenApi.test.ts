// fix for @ledgerhq/hw-transport-u2f 4.28.0
import '@babel/polyfill';
import tradesRest from '../samples/kraken/tradesRest.json';
import dbUtil from '../utils/dbUtil';
import httpUtil from '../utils/httpUtil';
import api from './krakenApi';

api.init();
let sourceCashPair = ['ETH', 'USD']
	.sort(() => (api.settings.quoteInversed ? 1 : -1))
	.join(api.settings.separator);
if (api.settings.isLowercase) sourceCashPair = sourceCashPair.toLowerCase();
const localCashPair = 'ETH|USD';
api.sourcePairMapping[sourceCashPair] = localCashPair;

test('fetchTradesREST spot', async () => {
	api.settings.supportWS = false;
	api.last = {};
	api.tradeStatusLastUpdatedAt = {};

	httpUtil.get = jest.fn(() => Promise.resolve(JSON.stringify(tradesRest)));
	dbUtil.insertTradeData = jest.fn(() => Promise.resolve());

	await api.fetchTradesREST(sourceCashPair);
	expect((httpUtil.get as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
	const calls = (dbUtil.insertTradeData as jest.Mock<Promise<void>>).mock.calls;
	expect(calls).toMatchSnapshot();
	expect(calls.length).toEqual(
		Object.keys(tradesRest.result)
			.map(key => (tradesRest as { [key: string]: any }).result[key])
			.filter((x: any) => Array.isArray(x))
			.map(x => x.length)
			.reduce((x1: number, x2: number) => x1 + x2)
	);
});

test('fetchTradesWS', () => expect(() => api.fetchTradesWS()).toThrowErrorMatchingSnapshot());
