import child_process from 'child_process';
import geminiApi from '../apis/geminiApi';
import marketUtil from './marketUtil';
import osUtil from './osUtil';
import util from './util';

test('retry after long enought time', () => {
	child_process.exec = jest.fn() as any;
	util.getUTCNowTimestamp = jest.fn(() => 1234567890);
	child_process.exec = jest.fn() as any;
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
		live: false
	} as any);
	expect(((child_process.exec as any) as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
	expect(marketUtil.subProcesses).toMatchSnapshot();
	expect((marketUtil.retry as jest.Mock<void>).mock.calls).toMatchSnapshot();
});

test('launchSource success windows', () => {
	osUtil.isWindows = jest.fn(() => true);
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
	expect(((child_process.exec as any) as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
	expect(marketUtil.subProcesses).toMatchSnapshot();
	expect(
		(marketUtil.subProcesses['source'].instance.on as jest.Mock<void>).mock.calls
	).toMatchSnapshot();
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
		live: false
	} as any);
	expect(((child_process.exec as any) as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
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
	expect(((child_process.exec as any) as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
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
	expect(((child_process.exec as any) as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
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
	expect(((child_process.exec as any) as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
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
	expect(((child_process.exec as any) as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
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
	expect(((child_process.exec as any) as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
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
	expect(((child_process.exec as any) as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
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
	expect(((child_process.exec as any) as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
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

	expect((marketUtil.launchSource as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
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
	expect((geminiApi.fetchTrades as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});
