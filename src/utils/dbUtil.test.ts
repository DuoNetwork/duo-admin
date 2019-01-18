import dbUtil from './dbUtil';
import dynamoUtil from './dynamoUtil';
import keyUtil from './keyUtil';
import sqlUtil from './sqlUtil';
import util from './util';

let hasReceipt = true;
const web3Mock = {
	fromWei: jest.fn(),
	getTransactionReceipt: jest.fn(() => Promise.resolve(hasReceipt ? { status: 'status' } : null))
} as any;

test('init only dynamo', async () => {
	dynamoUtil.init = jest.fn(() => Promise.resolve());
	sqlUtil.init = jest.fn(() => Promise.resolve());
	keyUtil.getSqlAuth = jest.fn(() => Promise.resolve());
	util.getStatusProcess = jest.fn(() => 'process');
	await dbUtil.init('tool', { dynamo: true, live: true } as any, web3Mock);
	expect((dynamoUtil.init as jest.Mock).mock.calls[0].slice(1)).toMatchSnapshot();
	(dynamoUtil.init as jest.Mock).mock.calls[0][3](123);
	expect(await (dynamoUtil.init as jest.Mock).mock.calls[0][4]('txHash')).toMatchSnapshot();
	hasReceipt = false;
	expect(await (dynamoUtil.init as jest.Mock).mock.calls[0][4]('txHash')).toBeFalsy();
	expect(web3Mock.fromWei.mock.calls).toMatchSnapshot();
	expect(web3Mock.getTransactionReceipt.mock.calls).toMatchSnapshot();
	expect(sqlUtil.init as jest.Mock).not.toBeCalled();
	expect(keyUtil.getSqlAuth as jest.Mock).not.toBeCalled();
});

test('init local', async () => {
	dynamoUtil.init = jest.fn(() => Promise.resolve());
	sqlUtil.init = jest.fn(() => Promise.resolve());
	keyUtil.getSqlAuth = jest.fn(() => Promise.resolve());
	util.getStatusProcess = jest.fn(() => 'process');
	await dbUtil.init('trades', { live: false } as any, web3Mock);
	expect((dynamoUtil.init as jest.Mock).mock.calls[0].slice(1)).toMatchSnapshot();
	expect(sqlUtil.init as jest.Mock).toBeCalledTimes(1);
	expect(keyUtil.getSqlAuth as jest.Mock).not.toBeCalled();
});

test('init server', async () => {
	dynamoUtil.init = jest.fn(() => Promise.resolve());
	sqlUtil.init = jest.fn(() => Promise.resolve());
	keyUtil.getSqlAuth = jest.fn(() =>
		Promise.resolve({
			host: '',
			user: '',
			password: ''
		})
	);
	util.getStatusProcess = jest.fn(() => 'process');
	await dbUtil.init('trades', { live: true, server: true } as any, web3Mock);
	expect((dynamoUtil.init as jest.Mock).mock.calls[0].slice(1)).toMatchSnapshot();
	expect(sqlUtil.init as jest.Mock).toBeCalledTimes(1);
	expect(keyUtil.getSqlAuth as jest.Mock).toBeCalledTimes(1);
});

test('insertTradeData', async () => {
	dynamoUtil.insertTradeData = jest.fn();
	sqlUtil.insertTradeData = jest.fn();
	dbUtil.dynamo = true;
	await dbUtil.insertTradeData('trade' as any, true);
	dbUtil.dynamo = false;
	await dbUtil.insertTradeData('trade' as any, false);
	expect((dynamoUtil.insertTradeData as jest.Mock).mock.calls).toMatchSnapshot();
	expect((sqlUtil.insertTradeData as jest.Mock).mock.calls).toMatchSnapshot();
});

test('insertPrice', async () => {
	sqlUtil.insertPrice = jest.fn();
	dbUtil.dynamo = true;
	try {
		await dbUtil.insertPrice('price' as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
	dbUtil.dynamo = false;
	await dbUtil.insertPrice('price' as any);
	expect((sqlUtil.insertPrice as jest.Mock).mock.calls).toMatchSnapshot();
});

test('readLastPrice', async () => {
	sqlUtil.readLastPrice = jest.fn();
	dbUtil.dynamo = true;
	try {
		await dbUtil.readLastPrice('base', 'quote');
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
	dbUtil.dynamo = false;
	await dbUtil.readLastPrice('base', 'quote');
	expect((sqlUtil.readLastPrice as jest.Mock).mock.calls).toMatchSnapshot();
});

test('readSourceData', async () => {
	sqlUtil.readSourceData = jest.fn();
	dbUtil.dynamo = true;
	try {
		await dbUtil.readSourceData(123, 'base', 'quote');
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
	dbUtil.dynamo = false;
	await dbUtil.readSourceData(123, 'base', 'quote');
	expect((sqlUtil.readSourceData as jest.Mock).mock.calls).toMatchSnapshot();
});

test('cleanDB', async () => {
	sqlUtil.cleanDB = jest.fn();
	dbUtil.dynamo = true;
	try {
		await dbUtil.cleanDB();
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
	dbUtil.dynamo = false;
	await dbUtil.cleanDB();
	expect(sqlUtil.cleanDB as jest.Mock).toBeCalledTimes(1);
});

test('insertHeartbeat', async () => {
	dynamoUtil.insertHeartbeat = jest.fn();
	await dbUtil.insertHeartbeat();
	await dbUtil.insertHeartbeat('data' as any);
	expect((dynamoUtil.insertHeartbeat as jest.Mock).mock.calls).toMatchSnapshot();
});
