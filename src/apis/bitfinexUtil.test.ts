import dbUtil from '../dbUtil';
import bitfinexUtil from './bitfinexUtil';
const messages: string[] = require('../samples/bitfinex.json');

messages.forEach((msg, i) =>
	test('parseApiResponse ' + i, async () => {
		dbUtil.insertSourceData = jest.fn(() => Promise.resolve());
		await bitfinexUtil.parseApiResponse(msg);
		(dbUtil.insertSourceData as jest.Mock<Promise<void>>).mock.calls.forEach(c =>
			expect(c[0]).toMatchSnapshot()
		);
	})
);
