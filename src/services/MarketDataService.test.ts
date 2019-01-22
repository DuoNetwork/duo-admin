// fix for @ledgerhq/hw-transport-u2f 4.28.0
import '@babel/polyfill';
import child_process from 'child_process';
import { kovan } from '../../../duo-contract-wrapper/src/contractAddresses';
import geminiApi from '../apis/geminiApi';
import dbUtil from '../utils/dbUtil';
import osUtil from '../utils/osUtil';
import util from '../utils/util';
import MarketDataService from './MarketDataService';
jest.mock('../../../duo-contract-wrapper/src/Web3Wrapper', () =>
	jest.fn(() => ({
		contractAddresses: kovan
	}))
);

const marketDataService = new MarketDataService('tool', {} as any);
test('retry after long enought time', () => {
	const launchMock = jest.fn();
	const launchOriginal = marketDataService.launchSource;
	marketDataService.launchSource = launchMock;
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	global.setTimeout = jest.fn();
	marketDataService.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: util.getUTCNowTimestamp() - (30000 + 1),
		failCount: 2,
		instance: undefined as any
	};
	marketDataService.retry(
		'tool',
		{
			forceREST: false,
			debug: false,
			live: false
		} as any,
		'source',
		['asset1', 'asset2', 'asset3']
	);
	expect(marketDataService.subProcesses['source']).toMatchSnapshot();
	expect((global.setTimeout as jest.Mock).mock.calls).toMatchSnapshot();
	(global.setTimeout as jest.Mock).mock.calls[0][0]();
	expect(launchMock.mock.calls).toMatchSnapshot();
	marketDataService.launchSource = launchOriginal;
});

test('retry within short time', () => {
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	child_process.exec = jest.fn() as any;
	marketDataService.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: util.getUTCNowTimestamp() - (30000 - 1),
		failCount: 2,
		instance: undefined as any
	};
	marketDataService.retry(
		'tool',
		{
			forceREST: false,
			debug: false,
			live: false
		} as any,
		'source',
		['asset1', 'asset2', 'asset3']
	);
	expect(marketDataService.subProcesses['source']).toMatchSnapshot();
});

test('launchSource fail windows', () => {
	osUtil.isWindows = jest.fn(() => true);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.retry = jest.fn();
	marketDataService.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: false,
		live: false,
		dynamo: true,
		azure: true
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
	expect((marketDataService.retry as jest.Mock<void>).mock.calls).toMatchSnapshot();
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
	marketDataService.retry = jest.fn();
	marketDataService.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 5,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: false,
		live: false,
		aws: true
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
	expect(execOn.mock.calls).toMatchSnapshot();
	execOn.mock.calls[0][1]();
	execOn.mock.calls[0][1](1);
	expect((marketDataService.retry as jest.Mock).mock.calls).toMatchSnapshot();
});

test('launchSource forceREST windows', () => {
	osUtil.isWindows = jest.fn(() => true);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: true,
		debug: false,
		live: false,
		gcp: true,
		server: true
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
});

test('launchSource debug windows', () => {
	osUtil.isWindows = jest.fn(() => true);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: true,
		live: false
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
});

test('launchSource live windows', () => {
	osUtil.isWindows = jest.fn(() => true);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: false,
		live: true
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
});

test('launchSource fail not windows', () => {
	osUtil.isWindows = jest.fn(() => false);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.retry = jest.fn();
	marketDataService.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: false,
		live: false
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
	expect((marketDataService.retry as jest.Mock<void>).mock.calls).toMatchSnapshot();
});

test('launchSource success not windows', () => {
	osUtil.isWindows = jest.fn(() => false);
	child_process.exec = jest.fn(() => {
		return {
			on: jest.fn()
		};
	}) as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.retry = jest.fn();
	marketDataService.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 5,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: false,
		live: false
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
	expect(
		(marketDataService.subProcesses['source'].instance.on as jest.Mock<void>).mock.calls
	).toMatchSnapshot();
});

test('launchSource forceREST not windows', () => {
	osUtil.isWindows = jest.fn(() => false);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: true,
		debug: false,
		live: false
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
});

test('launchSource debug not windows', () => {
	osUtil.isWindows = jest.fn(() => false);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: true,
		live: false
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
});

test('launchSource live not windows', () => {
	osUtil.isWindows = jest.fn(() => false);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.subProcesses['source'] = {
		source: 'source',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: false,
		live: true
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
});

test('startFetching no source', async () => {
	util.sleep = jest.fn();
	marketDataService.launchSource = jest.fn();

	await marketDataService.startFetching('tool', {
		source: '',
		sources: [],
		exSources: [],
		assets: ['quote', 'base'],
		forceREST: false,
		debug: false
	} as any);

	await marketDataService.startFetching('tool', {
		source: '',
		sources: ['gemini', 'kraken'],
		exSources: [],
		assets: ['quote', 'base'],
		forceREST: false,
		debug: false
	} as any);

	await marketDataService.startFetching('tool', {
		source: '',
		sources: ['gemini', 'kraken'],
		exSources: [],
		pair: 'someQuote|someBase',
		assets: [],
		forceREST: false,
		debug: false
	} as any);

	expect((marketDataService.launchSource as jest.Mock).mock.calls).toMatchSnapshot();
});

test('startFetching source', async () => {
	util.sleep = jest.fn();
	geminiApi.getSourcePairs = jest.fn(() => ['quote|base']);
	geminiApi.fetchTrades = jest.fn();
	await marketDataService.startFetching('tool', {
		source: 'gemini',
		assets: ['quote', 'base'],
		forceREST: true,
		debug: false
	} as any);

	try {
		await marketDataService.startFetching('tool', {
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
	await marketDataService.startFetching('tool', {
		source: 'gemini',
		assets: ['quote', 'base'],
		forceREST: true,
		debug: false
	} as any);

	expect(geminiApi.fetchTrades as jest.Mock).not.toBeCalled();
});

test('cleanDb', async () => {
	dbUtil.init = jest.fn();
	dbUtil.cleanDB = jest.fn();
	dbUtil.insertHeartbeat = jest.fn();
	global.setInterval = jest.fn();
	await marketDataService.cleanDb();
	expect(dbUtil.cleanDB as jest.Mock).toBeCalledTimes(1);
	for (const call of (global.setInterval as jest.Mock).mock.calls)
		expect(call[1]).toMatchSnapshot();

	(global.setInterval as jest.Mock).mock.calls[0][0]();
	expect(dbUtil.cleanDB as jest.Mock).toBeCalledTimes(2);
	(global.setInterval as jest.Mock).mock.calls[1][0]();
	expect(dbUtil.insertHeartbeat as jest.Mock).toBeCalledTimes(1);
});
