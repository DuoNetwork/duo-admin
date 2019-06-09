// fix for @ledgerhq/hw-transport-u2f 4.28.0
import '@babel/polyfill';
import { kovan } from '@finbook/duo-contract-wrapper/dist/contractAddresses';
import child_process from 'child_process';
import geminiApi from '../apis/geminiApi';
import dbUtil from '../utils/dbUtil';
import osUtil from '../utils/osUtil';
import priceUtil from '../utils/priceUtil';
import util from '../utils/util';
import MarketDataService from './MarketDataService';

jest.mock('@finbook/duo-contract-wrapper', () => ({
	Web3Wrapper: jest.fn(() => ({
		contractAddresses: kovan
	}))
}));

const triggerMock = jest.fn();
const fetchEventMock = jest.fn();
const commitPriceMock = jest.fn();
const fetchPriceMock = jest.fn();
jest.mock('../services/ContractService', () =>
	jest.fn().mockImplementation(() => ({
		trigger: triggerMock,
		fetchEvent: fetchEventMock,
		commitPrice: commitPriceMock,
		fetchPrice: fetchPriceMock
	}))
);

import ContractService from '../services/ContractService';

const marketDataService = new MarketDataService();
test('retry after long enought time', () => {
	const launchMock = jest.fn();
	const launchOriginal = marketDataService.launchSource;
	marketDataService.launchSource = launchMock;
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	global.setTimeout = jest.fn();
	marketDataService.subProcesses['source'] = {
		processName: 'source',
		lastFailTimestamp: util.getUTCNowTimestamp() - (30000 + 1),
		failCount: 2,
		instance: undefined as any
	};
	marketDataService.retry('source', launchMock);
	expect(marketDataService.subProcesses['source']).toMatchSnapshot();
	expect((global.setTimeout as jest.Mock).mock.calls).toMatchSnapshot();
	(global.setTimeout as jest.Mock).mock.calls[0][0]();
	expect(launchMock as jest.Mock).toBeCalledTimes(1);
	marketDataService.launchSource = launchOriginal;
});
test('retry within short time', () => {
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	child_process.exec = jest.fn() as any;
	marketDataService.subProcesses['source'] = {
		processName: 'source',
		lastFailTimestamp: util.getUTCNowTimestamp() - (30000 - 1),
		failCount: 2,
		instance: undefined as any
	};
	marketDataService.retry('source', () => jest.fn());
	expect(marketDataService.subProcesses['source']).toMatchSnapshot();
});

test('launchSource fail windows', () => {
	osUtil.isWindows = jest.fn(() => true);
	child_process.exec = jest.fn(() => false) as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.retry = jest.fn();
	marketDataService.subProcesses['source'] = {
		processName: 'source',
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
	const originalLaunchSource = marketDataService.launchSource;
	marketDataService.launchSource = jest.fn();
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
	expect((marketDataService.retry as jest.Mock<void>).mock.calls).toMatchSnapshot();
	(marketDataService.retry as jest.Mock).mock.calls[0][1]();
	expect((marketDataService.launchSource as jest.Mock).mock.calls).toMatchSnapshot();
	marketDataService.launchSource = originalLaunchSource;
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
		processName: 'source',
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
	const originalLaunchSource = marketDataService.launchSource;
	marketDataService.launchSource = jest.fn();
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
	expect(execOn.mock.calls).toMatchSnapshot();
	execOn.mock.calls[0][1]();
	execOn.mock.calls[0][1](1);
	expect((marketDataService.retry as jest.Mock).mock.calls).toMatchSnapshot();
	(marketDataService.retry as jest.Mock).mock.calls[0][1]();
	expect((marketDataService.launchSource as jest.Mock).mock.calls).toMatchSnapshot();
	marketDataService.launchSource = originalLaunchSource;
});

test('launchSource forceREST windows', () => {
	osUtil.isWindows = jest.fn(() => true);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.subProcesses['source'] = {
		processName: 'source',
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
		processName: 'source',
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
		processName: 'source',
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
		processName: 'source',
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
		processName: 'source',
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
		(marketDataService.subProcesses['source'].instance.on as jest.Mock).mock.calls
	).toMatchSnapshot();
});

test('launchSource forceREST not windows', () => {
	osUtil.isWindows = jest.fn(() => false);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.subProcesses['source'] = {
		processName: 'source',
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
		processName: 'source',
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
		processName: 'source',
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

test('launchEvent ', () => {
	osUtil.isWindows = jest.fn(() => false);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.subProcesses['event'] = {
		processName: 'event',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchEvent('tool', 'event', {
		forceREST: true,
		force: true,
		debug: false,
		live: false,
		event: 'event',
		gcp: true
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
});

test('launchEvent azure', () => {
	osUtil.isWindows = jest.fn(() => false);
	const on = jest.fn();
	child_process.exec = jest.fn(() => ({
		on: on
	})) as any;
	marketDataService.retry = jest.fn();
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.subProcesses['event'] = {
		processName: 'event',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchEvent('tool', 'event', {
		forceREST: false,
		debug: false,
		live: true,
		event: 'event',
		azure: true
	} as any);
	const originalLaunchEvent = marketDataService.launchEvent;
	marketDataService.launchEvent = jest.fn();
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect((marketDataService.retry as jest.Mock).mock.calls).toMatchSnapshot();
	(on as jest.Mock).mock.calls[0][1]();
	(on as jest.Mock).mock.calls[0][1]('code');
	expect((on as jest.Mock).mock.calls).toMatchSnapshot();
	(marketDataService.retry as jest.Mock).mock.calls[0][1]();
	expect(marketDataService.subProcesses).toMatchSnapshot();
	expect((marketDataService.launchEvent as jest.Mock).mock.calls).toMatchSnapshot();
	marketDataService.launchEvent = originalLaunchEvent;
});

test('launchEvent with existingInstance, no windows', () => {
	osUtil.isWindows = jest.fn(() => true);
	child_process.exec = jest.fn(() => null) as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.retry = jest.fn();
	marketDataService.subProcesses['Others'] = {
		processName: 'Others',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchEvent('tool', 'Others', {
		forceREST: false,
		debug: false,
		live: true,
		event: 'Others',
		server: true,
		aws: true
	} as any);
	const originalLaunchEvent = marketDataService.launchEvent;
	marketDataService.launchEvent = jest.fn();
	expect((marketDataService.retry as jest.Mock).mock.calls).toMatchSnapshot();
	(marketDataService.retry as jest.Mock).mock.calls[0][1]();
	expect((marketDataService.launchEvent as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
	marketDataService.launchEvent = originalLaunchEvent;
});

test('launchPriceFixService ', () => {
	osUtil.isWindows = jest.fn(() => false);
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.subProcesses['pair'] = {
		processName: 'pair',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchPriceFixService('tool', 'pair', {
		debug: false,
		live: true,
		pair: 'pair',
		gcp: true
	} as any);
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
});

test('launchPriceFixService azure', () => {
	osUtil.isWindows = jest.fn(() => false);
	const on = jest.fn();
	child_process.exec = jest.fn(() => ({
		on: on
	})) as any;
	marketDataService.retry = jest.fn();
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.subProcesses['pair'] = {
		processName: 'pair',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchPriceFixService('tool', 'pair', {
		debug: false,
		live: true,
		pair: 'pair',
		azure: true
	} as any);
	const launchPriceFixService = marketDataService.launchPriceFixService;
	marketDataService.launchPriceFixService = jest.fn();
	expect(((child_process.exec as any) as jest.Mock).mock.calls).toMatchSnapshot();
	expect((marketDataService.retry as jest.Mock).mock.calls).toMatchSnapshot();
	(on as jest.Mock).mock.calls[0][1]();
	(on as jest.Mock).mock.calls[0][1]('code');
	expect((on as jest.Mock).mock.calls).toMatchSnapshot();
	(marketDataService.retry as jest.Mock).mock.calls[0][1]();
	expect(marketDataService.subProcesses).toMatchSnapshot();
	expect((marketDataService.launchPriceFixService as jest.Mock).mock.calls).toMatchSnapshot();
	marketDataService.launchPriceFixService = launchPriceFixService;
});

test('launchPriceFixService with existingInstance, no windows', () => {
	osUtil.isWindows = jest.fn(() => true);
	child_process.exec = jest.fn(() => null) as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	marketDataService.retry = jest.fn();
	marketDataService.subProcesses['pair'] = {
		processName: 'pair',
		lastFailTimestamp: 0,
		failCount: 0,
		instance: undefined as any
	};
	marketDataService.launchPriceFixService('tool', 'pair', {
		debug: false,
		live: false,
		pair: 'pair',
		server: true,
		aws: true
	} as any);
	const originallaunchPriceFixService = marketDataService.launchPriceFixService;
	marketDataService.launchPriceFixService = jest.fn();
	expect((marketDataService.retry as jest.Mock).mock.calls).toMatchSnapshot();
	(marketDataService.retry as jest.Mock).mock.calls[0][1]();
	expect((marketDataService.launchPriceFixService as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
	marketDataService.launchPriceFixService = originallaunchPriceFixService;
});

test('startFetching no source', async () => {
	util.sleep = jest.fn();
	marketDataService.launchSource = jest.fn();

	await marketDataService.startFetchingTrade('tool', {
		source: '',
		sources: [],
		exSources: [],
		assets: ['quote', 'base'],
		forceREST: false,
		debug: false
	} as any);

	await marketDataService.startFetchingTrade('tool', {
		source: '',
		sources: ['gemini', 'kraken'],
		exSources: [],
		assets: ['quote', 'base'],
		forceREST: false,
		debug: false
	} as any);

	await marketDataService.startFetchingTrade('tool', {
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
	await marketDataService.startFetchingTrade('tool', {
		source: 'gemini',
		assets: ['quote', 'base'],
		forceREST: true,
		debug: false
	} as any);

	try {
		await marketDataService.startFetchingTrade('tool', {
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
	await marketDataService.startFetchingTrade('tool', {
		source: 'gemini',
		assets: ['quote', 'base'],
		forceREST: true,
		debug: false
	} as any);

	expect(geminiApi.fetchTrades as jest.Mock).not.toBeCalled();
});

test('startFetchingEvent no event', async () => {
	util.sleep = jest.fn();
	marketDataService.launchEvent = jest.fn();

	await marketDataService.startFetchingEvent('tool', {
		event: '',
		debug: false,
		events: ['event1', 'event2']
	} as any);

	expect((marketDataService.launchEvent as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
});

test('startFetchingEvent with event', async () => {
	util.sleep = jest.fn();
	marketDataService.launchEvent = jest.fn();

	await marketDataService.startFetchingEvent('tool', {
		event: 'event',
		debug: false
	} as any);

	await marketDataService.startFetchingEvent('tool', {
		event: 'StartReset',
		debug: false
	} as any);

	expect(triggerMock).toBeCalledTimes(1);
	expect(fetchEventMock).toBeCalledTimes(1);
	expect((ContractService as any).mock.calls).toMatchSnapshot();
});

test('startPriceFixService no pair and pair', async () => {
	util.sleep = jest.fn();
	marketDataService.launchPriceFixService = jest.fn();

	await marketDataService.startPriceFixService('commit', {
		pair: '',
		debug: false
	} as any);

	expect(marketDataService.launchPriceFixService as jest.Mock).not.toBeCalled();
});

test('startPriceFixService no pair length and pair', async () => {
	util.sleep = jest.fn();
	marketDataService.launchPriceFixService = jest.fn();

	await marketDataService.startPriceFixService('commit', {
		pair: '',
		debug: false,
		pairs: []
	} as any);

	expect(marketDataService.launchPriceFixService as jest.Mock).not.toBeCalled();
});

test('startPriceFixService, commit, with pair', async () => {
	util.sleep = jest.fn();
	marketDataService.launchPriceFixService = jest.fn();

	await marketDataService.startPriceFixService('commit', {
		pair: 'pair',
		debug: false,
		pairs: []
	} as any);

	expect((marketDataService.launchPriceFixService as jest.Mock).mock.calls).toMatchSnapshot();
	expect((ContractService as any).mock.calls).toMatchSnapshot();
	expect(commitPriceMock).toBeCalledTimes(1);
});

test('startPriceFixService, fetchPrice, with pair', async () => {
	util.sleep = jest.fn();
	marketDataService.launchPriceFixService = jest.fn();

	await marketDataService.startPriceFixService('fetchPrice', {
		pair: 'pair',
		debug: false,
		pairs: []
	} as any);

	expect((marketDataService.launchPriceFixService as jest.Mock).mock.calls).toMatchSnapshot();
	expect((ContractService as any).mock.calls).toMatchSnapshot();
	expect(fetchPriceMock).toBeCalledTimes(1);
});

test('startPriceFixService, invalid tool, with pair', async () => {
	util.sleep = jest.fn();
	marketDataService.launchPriceFixService = jest.fn();

	await marketDataService.startPriceFixService('tool', {
		pair: 'pair',
		debug: false,
		pairs: []
	} as any);

	expect((marketDataService.launchPriceFixService as jest.Mock).mock.calls).toMatchSnapshot();
	expect((ContractService as any).mock.calls).toMatchSnapshot();
	expect(fetchPriceMock).toBeCalledTimes(1);
	expect(fetchPriceMock).toBeCalledTimes(1);
});

test('startPriceFixService no pair', async () => {
	util.sleep = jest.fn();
	marketDataService.launchPriceFixService = jest.fn();

	await marketDataService.startPriceFixService('tool', {
		pair: '',
		debug: false,
		pairs: ['pair1', 'pair2']
	} as any);

	expect((marketDataService.launchPriceFixService as jest.Mock).mock.calls).toMatchSnapshot();
	expect(marketDataService.subProcesses).toMatchSnapshot();
});

test('cleanDb', async () => {
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

test('startAggregate', async () => {
	global.setInterval = jest.fn();
	dbUtil.insertHeartbeat = jest.fn();
	priceUtil.aggregatePrice = jest.fn();
	await marketDataService.startAggregate(10);
	(global.setInterval as jest.Mock).mock.calls[0][0]();
	(global.setInterval as jest.Mock).mock.calls[1][0]();
	expect((dbUtil.insertHeartbeat as jest.Mock).mock.calls).toMatchSnapshot();
	expect((priceUtil.aggregatePrice as jest.Mock).mock.calls).toMatchSnapshot();
});
