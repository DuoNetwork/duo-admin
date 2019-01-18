import moment from 'moment';
import parsedTrades from '../samples/gdax/parsedTrades.json';
import tradesRest from '../samples/gdax/tradesRest.json';
import dbUtil from '../utils/dbUtil';
import httpUtil from '../utils/httpUtil';
import api from './gdaxApi';

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
	dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));

	await api.fetchTradesREST(sourceCashPair);
	expect((httpUtil.get as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
	const calls = (dbUtil.insertTradeData as jest.Mock<Promise<void>>).mock.calls;
	expect(calls).toMatchSnapshot();
});

test('parseTrade', async () => {
	moment().valueOf = jest.fn(() => Promise.resolve(123456789));
	parsedTrades.forEach(trade =>
		expect(api.parseTrade(sourceCashPair, trade)).toMatchSnapshot()
	);
});

test('fetchTradesWS', () => expect(() => api.fetchTradesWS()).toThrowErrorMatchingSnapshot());
