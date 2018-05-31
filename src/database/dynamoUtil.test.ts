// import * as CST from '../constants';
import dynamoUtil from './dynamoUtil';

const trade = {
	source: 'src',
	id: 'id',
	price: 123,
	amount: 456,
	timestamp: 1234567890
};

test('connection initalization', () => {
	return dynamoUtil.insertData({} as any).catch(error => expect(error).toMatchSnapshot());
});

test('convertTradeToSchema', () =>
	expect(dynamoUtil.convertTradeToSchema(trade, 123)).toMatchSnapshot());

test('convertTradeToSchema', () =>
	expect(
		dynamoUtil.convertPriceToSchema({
			price: 123,
			timestamp: 1234567890,
			volume: 456
		})
	).toMatchSnapshot());

test('insertTradeData', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	Date.now = jest.fn(() => 0);
	await dynamoUtil.insertTradeData(trade);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(2);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[1][0]).toMatchSnapshot();
});

test('insertHeartbeat', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	await dynamoUtil.insertHeartbeat();
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('insertStatusData', async () => {
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	await dynamoUtil.insertStatusData({ test: 'test' });
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls.length).toBe(1);
	expect((dynamoUtil.insertData as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});
