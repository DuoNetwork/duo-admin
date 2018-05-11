import sqlUtil from '../sqlUtil';
import bitfinexUtil from './bitfinexUtil';
const trades: Array<{ [key: string]: string }> = require('../samples/bitfinex.json');
const apiResponse = JSON.stringify(require('../samples/bitfinexMsg.json'));

test('parseTrade', () => {
	trades.forEach(async trade => {
		const parsedTrade = bitfinexUtil.parseTrade(trade);
		expect(parsedTrade).toMatchSnapshot();
	});
});

test('parseApiResponse', async () => {
	sqlUtil.insertSourceData = jest.fn(() => Promise.resolve());
	await bitfinexUtil.parseApiResponse(apiResponse);
	// for (let i = 0; i < 6; i++)
	expect(
		(sqlUtil.insertSourceData as jest.Mock<Promise<void>>).mock.calls[0][0]
	).toMatchSnapshot();
});
