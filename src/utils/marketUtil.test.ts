import child_process from 'child_process';
import geminiApi from '../apis/geminiApi';
import marketUtil from './marketUtil';
import util from './util';

test('launchSource', () => {
	child_process.exec = jest.fn() as any;
	marketUtil.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: false,
		live: false
	} as any);
	expect(((child_process.exec as any) as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('launchSource forceREST', () => {
	child_process.exec = jest.fn() as any;
	marketUtil.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: true,
		debug: false,
		live: false
	} as any);
	expect(((child_process.exec as any) as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('launchSource debug', () => {
	child_process.exec = jest.fn() as any;
	marketUtil.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: true,
		live: false
	} as any);
	expect(((child_process.exec as any) as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
});

test('launchSource live', () => {
	child_process.exec = jest.fn() as any;
	marketUtil.launchSource('tool', 'source', ['asset1', 'asset2', 'asset3'], {
		forceREST: false,
		debug: false,
		live: true
	} as any);
	expect(((child_process.exec as any) as jest.Mock<Promise<void>>).mock.calls).toMatchSnapshot();
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
