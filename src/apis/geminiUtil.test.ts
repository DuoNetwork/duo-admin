import dbUtil from '../dbUtil';
import trades from '../samples/gemini.json';
import apiResponse from '../samples/geminiMsg.json';
import geminiUtil from './geminiUtil';

test('parseTrade', () => {
	trades.forEach(async trade => {
		const parsedTrade = geminiUtil.parseTrade(trade);
		expect(parsedTrade).toMatchSnapshot();
	});
});

test('parseApiResponse', async () => {
	dbUtil.insertTradeData = jest.fn(() => Promise.resolve());
	await geminiUtil.parseApiResponse(JSON.stringify(apiResponse));
	// for (let i = 0; i < 6; i++)
	expect(
		(dbUtil.insertTradeData as jest.Mock<Promise<void>>).mock.calls[0][0]
	).toMatchSnapshot();
});
