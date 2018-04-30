import * as mysql from 'mysql';
import sqlUtil from './sqlUtil';
import { Price } from './types';

test('connection initalization', () => {
	return sqlUtil.executeQuery('test').catch(error => expect(error).toMatchSnapshot());
});

test('insertSourceData', async () => {
	sqlUtil.conn = mysql.createConnection({});
	sqlUtil.executeQuery = jest.fn(() => Promise.resolve());
	Date.now = jest.fn(() => 0);
	await sqlUtil.insertSourceData({
		source: 'src',
		tradeId: 'id',
		price: 123,
		amount: 456,
		tradeType: 'type',
		sourceTimestamp: 1234567890
	});
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('insertPrice', async () => {
	sqlUtil.conn = mysql.createConnection({});
	sqlUtil.executeQuery = jest.fn(() => Promise.resolve());
	await sqlUtil.insertPrice({
		price: 123,
		volume: 456,
		timestamp: 1234567890
	});
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('readLastPrice', async () => {
	sqlUtil.conn = mysql.createConnection({});
	sqlUtil.executeQuery = jest.fn(() =>
		Promise.resolve([
			{
				price: '123',
				volume: '456',
				timestamp: '1234567890'
			}
		])
	);
	const price = await sqlUtil.readLastPrice();
	expect(
		(sqlUtil.executeQuery as jest.Mock<Promise<Price[]>>).mock.calls[0][0]
	).toMatchSnapshot();
	expect(price).toMatchSnapshot();
});

test('readSourceData', async () => {
	sqlUtil.conn = mysql.createConnection({});
	sqlUtil.executeQuery = jest.fn(() => Promise.resolve([
		{
			exchange_source: 'src1',
			trade_id: 'id1',
			price: '123',
			amount: '456',
			trade_type: 'type1',
			exchange_returned_timestamp: '1234567890'
		},
		{
			exchange_source: 'src2',
			trade_id: 'id2',
			price: '234',
			amount: '567',
			trade_type: 'type2',
			exchange_returned_timestamp: '2345678901'
		}
	]));
	const trades = await sqlUtil.readSourceData(1234567890);
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect(trades).toMatchSnapshot();
});
