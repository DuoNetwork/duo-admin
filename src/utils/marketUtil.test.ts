import child_process from 'child_process';
import geminiApi from '../apis/geminiApi';
import marketUtil from './marketUtil';
import osUtil from './osUtil';
import util from './util';

test('retry after long enought time', () => {
	const launchMock = jest.fn();
	const launchOriginal = marketUtil.launchSource;
	marketUtil.launchSource = launchMock;
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	global.setTimeout = jest.fn();
	marketUtil.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: util.getUTCNowTimestamp() - (30000 + 1),
		failCount: 2,
		instance: undefined as any
	};
	marketUtil.retry(
		'tool',
		{
			forceREST: false,
			debug: false,
			live: false
		} as any,
		'source',
		['asset1', 'asset2', 'asset3']
	);
	expect(marketUtil.subProcesses['source']).toMatchSnapshot();
	expect((global.setTimeout as jest.Mock).mock.calls).toMatchSnapshot();
	(global.setTimeout as jest.Mock).mock.calls[0][0]();
	expect(launchMock.mock.calls).toMatchSnapshot();
	marketUtil.launchSource = launchOriginal;
});

test('retry within short time', () => {
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	child_process.exec = jest.fn() as any;
	marketUtil.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: util.getUTCNowTimestamp() - (30000 - 1),
		failCount: 2,
		instance: undefined as any
	};
	marketUtil.retry(
		'tool',
		{
			forceREST: false,
			debug: false,
			live: false
		} as any,
		'source',
		['asset1', 'asset2', 'asset3']
	);
	expect(marketUtil.subProcesses['source']).toMatchSnapshot();
});

test('launchSource fail windows', () => {
	osUtil.isWindows = jest.fn(() => true);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketUtil.retry = jest.fn();
	marketUtil.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketUtil.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: false,
		live: false,
		dynamo: true,
		azure: true
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketUtil.subProcesses).toMatchSnapshot();
	expect((marketUtil.retry as jest.Mock<void>).mock.calls).toMatchSnapshot();
});

test('launchSource success windows', () => {
	osUtil.isWindows = jest.fn(() => true);
	const execOn = jest.fn();
	child_process.exec = jest.fn(() => {
		return {
			on: execOn
		};
	}) as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketUtil.retry = jest.fn();
	marketUtil.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 5,
		failCount: 0,
		instance: undefined as any
	};
	marketUtil.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: false,
		live: false,
		aws: true
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketUtil.subProcesses).toMatchSnapshot();
	expect(execOn.mock.calls).toMatchSnapshot();
	execOn.mock.calls[0][1]();
	execOn.mock.calls[0][1](1);
	expect((marketUtil.retry as jest.Mock).mock.calls).toMatchSnapshot();
});

test('launchSource forceREST windows', () => {
	osUtil.isWindows = jest.fn(() => true);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketUtil.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketUtil.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: true,
		debug: false,
		live: false,
		gcp: true,
		server: true
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketUtil.subProcesses).toMatchSnapshot();
});

test('launchSource debug windows', () => {
	osUtil.isWindows = jest.fn(() => true);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketUtil.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketUtil.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: true,
		live: false
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketUtil.subProcesses).toMatchSnapshot();
});

test('launchSource live windows', () => {
	osUtil.isWindows = jest.fn(() => true);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketUtil.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketUtil.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: false,
		live: true
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketUtil.subProcesses).toMatchSnapshot();
});

test('launchSource fail not windows', () => {
	osUtil.isWindows = jest.fn(() => false);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketUtil.retry = jest.fn();
	marketUtil.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketUtil.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: false,
		live: false
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketUtil.subProcesses).toMatchSnapshot();
	expect((marketUtil.retry as jest.Mock<void>).mock.calls).toMatchSnapshot();
});

test('launchSource success not windows', () => {
	osUtil.isWindows = jest.fn(() => false);
	child_process.exec = jest.fn(() => {
		return {
			on: jest.fn()
		};
	}) as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketUtil.retry = jest.fn();
	marketUtil.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 5,
		failCount: 0,
		instance: undefined as any
	};
	marketUtil.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: false,
		live: false
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketUtil.subProcesses).toMatchSnapshot();
	expect(
		(marketUtil.subProcesses['source'].instance.on as jest.Mock<void>).mock.calls
	).toMatchSnapshot();
});

test('launchSource forceREST not windows', () => {
	osUtil.isWindows = jest.fn(() => false);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketUtil.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketUtil.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: true,
		debug: false,
		live: false
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketUtil.subProcesses).toMatchSnapshot();
});

test('launchSource debug not windows', () => {
	osUtil.isWindows = jest.fn(() => false);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketUtil.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketUtil.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: true,
		live: false
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketUtil.subProcesses).toMatchSnapshot();
});

test('launchSource live not windows', () => {
	osUtil.isWindows = jest.fn(() => false);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketUtil.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketUtil.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: false,
		live: true
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketUtil.subProcesses).toMatchSnapshot();
});

test('startFetching no source', async () => {
	util.sleep = jest.fn();
	marketUtil.launchSource = jest.fn();

	await marketUtil.startFetching('tool', {
		source: '',
		sources: [],
		exSources: [],
		assets: ['quote', 'base'],
		forceREST: false,
		debug: false
	} as any);

	await marketUtil.startFetching('tool', {
		source: '',
		sources: ['gemini', 'kraken'],
		exSources: [],
		assets: ['quote', 'base'],
		forceREST: false,
		debug: false
	} as any);

	await marketUtil.startFetching('tool', {
		source: '',
		sources: ['gemini', 'kraken'],
		exSources: [],
		pair: 'someQuote|someBase',
		assets: [],
		forceREST: false,
		debug: false
	} as any);

	expect((marketUtil.launchSource as jest.Mock).mock.calls).toMatchSnapshot();
});

test('startFetching source', async () => {
	util.sleep = jest.fn();
	geminiApi.getSourcePairs = jest.fn(() => ['quote|base']);
	geminiApi.fetchTrades = jest.fn();
	await marketUtil.startFetching('tool', {
		source: 'gemini',
		assets: ['quote', 'base'],
		forceREST: true,
		debug: false
	} as any);

	try {
		await marketUtil.startFetching('tool', {
			source: 'gemini1',
			sources: [],
			exSources: [],
			pair: 'someQuote|someBase',
			assets: [],
			forceREST: false,
			debug: false
		} as any);
	} catch (error) {
		expect(error).toMatchSnapshot();
	}

	expect((geminiApi.fetchTrades as jest.Mock).mock.calls).toMatchSnapshot();
});

test('startFetching source no sourcePairs', async () => {
	util.sleep = jest.fn();
	geminiApi.getSourcePairs = jest.fn(() => []);
	geminiApi.fetchTrades = jest.fn();
	await marketUtil.startFetching('tool', {
		source: 'gemini',
		assets: ['quote', 'base'],
		forceREST: true,
		debug: false
	} as any);

	expect(geminiApi.fetchTrades as jest.Mock).not.toBeCalled();
});
