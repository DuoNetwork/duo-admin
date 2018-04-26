import * as mysql from 'mysql';
import sqlUtil from './sqlUtil';

test('connection initalization', () => {
	return sqlUtil.executeQuery('test').catch(error => expect(error).toMatchSnapshot());
});

test('insertSourceData', async () => {
	sqlUtil.conn = mysql.createConnection({});
	sqlUtil.executeQuery = jest.fn(() => Promise.resolve());
	await sqlUtil.insertSourceData('src', 'id', 'px', 'amt', 'type', 'ts');
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('insertPrice', async () => {
	sqlUtil.conn = mysql.createConnection({});
	sqlUtil.executeQuery = jest.fn(() => Promise.resolve());
	await sqlUtil.insertPrice('ts', 'px');
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('readLastPrice', async () => {
	sqlUtil.conn = mysql.createConnection({});
	sqlUtil.executeQuery = jest.fn(() => Promise.resolve());
	await sqlUtil.readLastPrice();
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('readSourceData', async () => {
	sqlUtil.conn = mysql.createConnection({});
	sqlUtil.executeQuery = jest.fn(() => Promise.resolve());
	await sqlUtil.readSourceData(1234567890);
	expect((sqlUtil.executeQuery as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});
