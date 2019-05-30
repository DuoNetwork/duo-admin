import httpUtil from './httpUtil';

let error = '';
const res = { statusCode: 200, statusMessage: 'statusMessage' };
const body = 'body';
jest.mock('request', () =>
	jest.fn((option: any, cb: any) => {
		if (option) cb(error, res, body);
	})
);

test('get', async () => {
	expect(await httpUtil.get('url')).toBe('body');
});

test('get error', async () => {
	error = 'error';
	try {
		await httpUtil.get('url');
	} catch (error) {
		expect(error).toBe('error');
	}
});

test('get not 200', async () => {
	error = '';
	res.statusCode = 201;
	try {
		await httpUtil.get('url');
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});

test('post', async () => {
	res.statusCode = 200;
	expect(await httpUtil.postJson('url', {})).toBe('body');
});

test('post error', async () => {
	error = 'error';
	try {
		await httpUtil.postJson('url', {});
	} catch (error) {
		expect(error).toBe('error');
	}
});

test('post not 200', async () => {
	error = '';
	res.statusCode = 201;
	try {
		await httpUtil.postJson('url', {});
	} catch (error) {
		expect(error).toMatchSnapshot();
	}
});
