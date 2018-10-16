import tradesRest from '../samples/gdax/tradesRest.json';
import dbUtil from '../utils/dbUtil';
import util from '../utils/util';
import api from './krakenApi';

api.init();
let sourceCashPair = ['ETH', 'USD']
	.sort(() => (api.settings.quoteInversed ? 1 : -1))
	.join(api.settings.separator);
if (api.settings.isLowercase) sourceCashPair = sourceCashPair.toLowerCase();
const localCashPair = 'ETH|USD';
api.sourcePairMapping[sourceCashPair] = localCashPair;

let testCases: { [key: string]: any } = {};

testCases = {
	'fetchTradesREST spot': {
		sourceInstrument: sourceCashPair,
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
		expect(calls.length).toEqual(
			Object.keys(testCase.tradesRest.result)
				.map(key => testCase.tradesRest.result[key])
				.filter((x: any) => Array.isArray(x))
				.map(x => x.length)
				.reduce((x1: number, x2: number) => x1 + x2)
		);
	});
}
