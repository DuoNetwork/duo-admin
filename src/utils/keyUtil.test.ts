import keyUtil from './keyUtil';

test('getKey server and live', async () => {
	const keyString = JSON.stringify({
		publicKey: 'publicKey',
		privateKey: 'privateKey'
	});
	keyUtil.getAwsKey = jest.fn(() => Promise.resolve(keyString));
	keyUtil.getAzureKey = jest.fn(() => Promise.resolve(keyString));
	keyUtil.getGcpKey = jest.fn(() => Promise.resolve(keyString));
	await keyUtil.getKey({
		live: true,
		server: true,
		aws: true
	} as any);
	await keyUtil.getKey({
		live: true,
		server: true,
		azure: true
	} as any);
	await keyUtil.getKey({
		live: true,
		server: true,
		gcp: true
	} as any);
	await keyUtil.getKey({
		live: true,
		server: true
	} as any);
	expect((keyUtil.getAwsKey as jest.Mock).mock.calls).toMatchSnapshot();
	expect((keyUtil.getAzureKey as jest.Mock).mock.calls).toMatchSnapshot();
	expect((keyUtil.getGcpKey as jest.Mock).mock.calls).toMatchSnapshot();
});

test('getKey dev', async () => {
	const keyString = JSON.stringify({
		publicKey: 'publicKey',
		privateKey: 'privateKey'
	});
	keyUtil.getAwsKey = jest.fn(() => Promise.resolve(keyString));
	keyUtil.getAzureKey = jest.fn(() => Promise.resolve(keyString));
	keyUtil.getGcpKey = jest.fn(() => Promise.resolve(keyString));
	await keyUtil.getKey({
		aws: true
	} as any);
	await keyUtil.getKey({
		azure: true
	} as any);
	await keyUtil.getKey({
		gcp: true
	} as any);
	expect(keyUtil.getAwsKey as jest.Mock).not.toBeCalled();
	expect(keyUtil.getAzureKey as jest.Mock).not.toBeCalled();
	expect(keyUtil.getGcpKey as jest.Mock).not.toBeCalled();
});

test('getSqlAuth server and live', async () => {
	const keyString = JSON.stringify({
		host: 'host',
		user: 'user',
		password: 'password'
	});
	keyUtil.getAwsKey = jest.fn(() => Promise.resolve(keyString));
	keyUtil.getAzureKey = jest.fn(() => Promise.resolve(keyString));
	keyUtil.getGcpKey = jest.fn(() => Promise.resolve(keyString));
	await keyUtil.getSqlAuth({
		live: true,
		server: true,
		aws: true
	} as any);
	await keyUtil.getSqlAuth({
		live: true,
		server: true,
		azure: true
	} as any);
	await keyUtil.getSqlAuth({
		live: true,
		server: true,
		gcp: true
	} as any);
	await keyUtil.getSqlAuth({
		live: true,
		server: true
	} as any);
	expect((keyUtil.getAwsKey as jest.Mock).mock.calls).toMatchSnapshot();
	expect((keyUtil.getAzureKey as jest.Mock).mock.calls).toMatchSnapshot();
	expect((keyUtil.getGcpKey as jest.Mock).mock.calls).toMatchSnapshot();
});

test('getSqlAuth dev', async () => {
	const keyString = JSON.stringify({
		host: 'host',
		user: 'user',
		password: 'password'
	});
	keyUtil.getAwsKey = jest.fn(() => Promise.resolve(keyString));
	keyUtil.getAzureKey = jest.fn(() => Promise.resolve(keyString));
	keyUtil.getGcpKey = jest.fn(() => Promise.resolve(keyString));
	await keyUtil.getSqlAuth({
		aws: true
	} as any);
	await keyUtil.getSqlAuth({
		azure: true
	} as any);
	await keyUtil.getSqlAuth({
		gcp: true
	} as any);
	expect(keyUtil.getAwsKey as jest.Mock).not.toBeCalled();
	expect(keyUtil.getAzureKey as jest.Mock).not.toBeCalled();
	expect(keyUtil.getGcpKey as jest.Mock).not.toBeCalled();
});
