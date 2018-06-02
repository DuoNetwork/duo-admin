import dbUtil from '../dbUtil';
import krakenUtil from './krakenUtil';
const trades: Array<{ [key: string]: string }> = require('../samples/kraken.json');
const apiResponse = JSON.stringify(require('../samples/krakenMsg.json'));

test('parseTrade', () => {
	trades.forEach(async trade => {
		const parsedTrade = krakenUtil.parseTrade(trade);
		expect(parsedTrade).toMatchSnapshot();
	});
});

test('parseApiResponse', async () => {
	dbUtil.insertTradeData = jest.fn(() => Promise.resolve());
	await krakenUtil.parseApiResponse(apiResponse);
	expect(
		(dbUtil.insertTradeData as jest.Mock<Promise<void>>).mock.calls[0][0]
	).toMatchSnapshot();
});
