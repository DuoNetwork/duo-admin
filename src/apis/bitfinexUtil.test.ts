import dbUtil from '../dbUtil';
import messages from '../samples/bitfinex.json';
import bitfinexUtil from './bitfinexUtil';

messages.forEach((msg, i) =>
	test('parseApiResponse ' + i, async () => {
		dbUtil.insertTradeData = jest.fn(() => Promise.resolve());
		await bitfinexUtil.parseApiResponse(msg);
		(dbUtil.insertTradeData as jest.Mock<Promise<void>>).mock.calls.forEach(c =>
			expect(c[0]).toMatchSnapshot()
		);
	})
);
