import dbUtil from '../dbUtil';
import geminiUtil from './geminiUtil';
const trades: Array<{ [key: string]: string }> = require('../samples/gemini.json');
const apiResponse = JSON.stringify(require('../samples/geminiMsg.json'));

test('parseTrade', () => {
	trades.forEach(async trade => {
		const parsedTrade = geminiUtil.parseTrade(trade);
		expect(parsedTrade).toMatchSnapshot();
	});
});

test('parseApiResponse', async () => {
	dbUtil.insertSourceData = jest.fn(() => Promise.resolve());
	await geminiUtil.parseApiResponse(apiResponse);
	// for (let i = 0; i < 6; i++)
	expect(
		(dbUtil.insertSourceData as jest.Mock<Promise<void>>).mock.calls[0][0]
	).toMatchSnapshot();
});
