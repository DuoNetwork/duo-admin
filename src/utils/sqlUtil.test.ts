import { IPrice } from '../common/types';
import dynamoUtil from './dynamoUtil';
import sqlUtil from './sqlUtil';
import util from './util';

test('connection initalization', () => {
	return sqlUtil.executeQuery('test').catch(error => expect(error).toMatchSnapshot());
});

test('insertTradeData', async () => {
	sqlUtil.executeQuery = jest.fn(() => Promise.resolve());
	dynamoUtil.insertData = jest.fn(() => Promise.resolve());
	util.getUTCNowTimestamp = jest.fn(() => 0);
	await sqlUtil.insertTradeData({
		quote: 'quote',
		base: 'base',
		source: 'src',
		id: 'id',
		price: 123,
		amount: 456,
		timestamp: 1234567890
	}, true);
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('insertPrice', async () => {
	sqlUtil.executeQuery = jest.fn(() => Promise.resolve());
	await sqlUtil.insertPrice({
		price: 123,
		volume: 456,
		timestamp: 1234567890,
		source: '',
		base: 'USD',
		quote: 'ETH'
	});
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('readLastPrice', async () => {
	sqlUtil.executeQuery = jest.fn(() =>
		Promise.resolve([
			{
				price: '123',
				volume: '456',
				timestamp: '1234567890'
			}
		])
	);
	const price = await sqlUtil.readLastPrice('USD', 'ETH');
	expect(
		(sqlUtil.executeQuery as jest.Mock<Promise<IPrice[]>>).mock.calls[0][0]
	).toMatchSnapshot();
	expect(price).toMatchSnapshot();
});

test('readSourceData', async () => {
	sqlUtil.executeQuery = jest.fn(() =>
		Promise.resolve([
			{
				source: 'src1',
				id: 'id1',
				price: '123',
				amount: '456',
				timestamp: '1234567890'
			},
			{
				source: 'src2',
				id: 'id2',
				price: '234',
				amount: '567',
				timestamp: '2345678901'
			}
		])
	);
	const trades = await sqlUtil.readSourceData(1234567890, 'USD', 'ETH');
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect(trades).toMatchSnapshot();
});

test('cleanDB', async () => {
	sqlUtil.executeQuery = jest.fn(() => Promise.resolve());
	await sqlUtil.cleanDB();
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});
