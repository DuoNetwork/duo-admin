import dbUtil from '../dbUtil';
import trades from '../samples/kraken.json';
import apiResponse from '../samples/krakenMsg.json';
import krakenUtil from './krakenUtil';

test('parseTrade', () => {
	trades.forEach(async trade => {
		const parsedTrade = krakenUtil.parseTrade(trade);
		expect(parsedTrade).toMatchSnapshot();
	});
});

test('parseApiResponse', async () => {
	dbUtil.insertTradeData = jest.fn(() => Promise.resolve());
	await krakenUtil.parseApiResponse(JSON.stringify(apiResponse));
	expect(
		(dbUtil.insertTradeData as jest.Mock<Promise<void>>).mock.calls[0][0]
	).toMatchSnapshot();
});
