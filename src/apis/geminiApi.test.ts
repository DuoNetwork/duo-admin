import dbUtil from '../dbUtil';
import tradesRest from '../samples/gemini/tradesRest.json';
import tradesWs from '../samples/gemini/tradesWs.json';
import util from '../util';
import api from './geminiApi';

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

		util.get = jest.fn(() => Promise.resolve(JSON.stringify(tradesRest)));
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
		msgTradesWS: [{ type: 'heartbeat', socket_sequence: 3 }, tradesWs]
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
