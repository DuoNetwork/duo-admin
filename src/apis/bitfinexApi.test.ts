import dbUtil from '../dbUtil';
import tradesRest from '../samples/bitfinex/tradesRest.json';
import tradesWsSnapshot from '../samples/bitfinex/tradesWsSnapshot.json';
import tradesWsUpdate from '../samples/bitfinex/tradesWsUpdate.json';
import util from '../util';
import api from './bitfinexApi';

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

		util.get = jest.fn(() => Promise.resolve(JSON.stringify(testCase.tradesRest)));
		dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));

		await api.fetchTradesREST(testCase.sourceInstrument);
		expect((util.get as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
		const calls = (dbUtil.insertTradeData as jest.Mock<Promise<void>>).mock.calls;
		expect(calls).toMatchSnapshot();
		expect(calls.length).toEqual(testCase.tradesRest.length);
	});
}

testCases = {
	'handleWSTradeMessage spot': {
		sourceInstrument: sourcePair,
		msgTradesWS: [
			tradesWsSnapshot,
			tradesWsUpdate,
			{ seq: '13224213-ETHBTC', timestamp: 1535617645, price: 0.040479, amount: 0.21911125 } //'te
		]
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
