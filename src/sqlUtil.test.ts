import * as mysql from 'mysql';
import sqlUtil from './sqlUtil';
import { Price, Trade } from './types';

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
		price: 'px',
		amount: 'amt',
		tradeType: 'type',
		sourceTimestamp: 'ts'
	});
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('insertPrice', async () => {
	sqlUtil.conn = mysql.createConnection({});
	sqlUtil.executeQuery = jest.fn(() => Promise.resolve());
	await sqlUtil.insertPrice({
		price: 'px',
		timestamp: 'ts'
	});
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('readLastPrice', async () => {
	sqlUtil.conn = mysql.createConnection({});
	sqlUtil.executeQuery = jest.fn(() =>
		Promise.resolve([
			{
				price: 'px',
				timestamp: 'ts'
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
			source: 'src1',
			tradeId: 'id1',
			price: 'px1',
			amount: 'amt1',
			tradeType: 'type1',
			sourceTimestamp: 'ts1'
		},
		{
			source: 'src2',
			tradeId: 'id2',
			price: 'px2',
			amount: 'amt2',
			tradeType: 'type2',
			sourceTimestamp: 'ts2'
		}
	]));
	const trades = await sqlUtil.readSourceData(1234567890);
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
	expect(trades).toMatchSnapshot();
});
