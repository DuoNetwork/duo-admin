// fix for @ledgerhq/hw-transport-u2f 4.28.0
import '@babel/polyfill';
import moment from 'moment';
// import ws from 'ws';
import * as CST from '../common/constants';
import { ISource } from '../common/types';
import dbUtil from '../utils/dbUtil';
import util from '../utils/util';
import BaseApi from './BaseApi';

import sources from '../samples/testSources.json';

class Api extends BaseApi {
	public async fetchTradesREST(sourcePair: string) {
		util.logInfo(sourcePair);
	}
}
const api = new Api();

jest.mock('ws', () =>
	jest.fn().mockImplementation(() => ({
		on: jest.fn()
	}))
);

const parsedTrades = [
	{
		id: 'ID_1',
		price: 0.05,
		amount: 1,
		source: 'source',
		base: 'USD',
		quote: 'ETH',
		timestamp: 1234567892
	},
	{
		id: 'ID_2',
		price: 0.05,
		amount: 1,
		source: 'source',
		base: 'USD',
		quote: 'ETH',
		timestamp: 1234567891
	}
];

test(`already initialized`, async () => {
	api.isInitialized = true;
	api.init();
	api.assetsInfo = (sources as { [key: string]: ISource })[api.source].assets;
	api.settings = (sources as { [key: string]: ISource })[api.source].settings;
	expect(api.settings).toMatchSnapshot();
});

test('handleWSTradeMessage, with extra', () =>
	expect(() => api.handleWSTradeMessage('tradeMessage', 'Extra')).toThrowErrorMatchingSnapshot());
test('handleWSTradeMessage', () =>
	expect(() => api.handleWSTradeMessage('tradeMessage')).toThrowErrorMatchingSnapshot());
test('handleWSTradeOpen', () =>
	expect(() =>
		api.handleWSTradeOpen(['pair1', 'pair2'], { url: 'url' } as any)
	).toThrowErrorMatchingSnapshot());

test(`getSourcePairs `, async () => {
	if (Object.keys(api.assetsInfo).length)
		api.assetsInfo = (sources as { [key: string]: ISource })[api.source].assets;

	util.getUTCNowTimestamp = jest.fn(() => moment.utc('20180924').valueOf());
	const sourceInstruments = api.getSourcePairs(['quote', 'base']);
	expect(sourceInstruments).toMatchSnapshot();
});

test(`getSourcePairs quoteInversed`, async () => {
	if (Object.keys(api.assetsInfo).length)
		api.assetsInfo = (sources as { [key: string]: ISource })[api.source].assets;
	api.settings.quoteInversed = false;
	api.settings.isLowercase = false;
	util.getUTCNowTimestamp = jest.fn(() => moment.utc('20180924').valueOf());
	const sourceInstruments = api.getSourcePairs(['quote', 'base']);
	expect(sourceInstruments).toMatchSnapshot();
});

test(`getSourcePairs isLowerCase`, async () => {
	if (Object.keys(api.assetsInfo).length)
		api.assetsInfo = (sources as { [key: string]: ISource })[api.source].assets;
	api.settings.isLowercase = true;
	util.getUTCNowTimestamp = jest.fn(() => moment.utc('20180924').valueOf());
	const sourceInstruments = api.getSourcePairs(['quote', 'base']);
	expect(sourceInstruments).toMatchSnapshot();
});

test(`getSourcePairs , not quoteInversed , isLowerCase true`, async () => {
	if (Object.keys(api.assetsInfo).length)
		api.assetsInfo = (sources as { [key: string]: ISource })[api.source].assets;
	api.settings.isLowercase = true;
	api.settings.quoteInversed = true;
	util.getUTCNowTimestamp = jest.fn(() => moment.utc('20180924').valueOf());
	const sourceInstruments = api.getSourcePairs(['quote', 'base']);
	expect(sourceInstruments).toMatchSnapshot();
});

test(`getSourcePairs, assetId wrong `, async () => {
	if (Object.keys(api.assetsInfo).length)
		api.assetsInfo = (sources as { [key: string]: ISource })[api.source].assets;

	util.getUTCNowTimestamp = jest.fn(() => moment.utc('20180924').valueOf());
	const sourceInstruments = api.getSourcePairs([]);
	expect(sourceInstruments).toMatchSnapshot();
});

test(`addTrades WS `, async () => {
	api.isInitialized = false;
	api.settings.supportWS = true;
	util.getUTCNowTimestamp = jest.fn(() => CST.TRADES_STATUS_LAST_UPDATE_INTERVAL_WS * 1000 + 1);
	dbUtil.insertTradeData = jest.fn(() => Promise.resolve());
	const localPair = `${parsedTrades[0].quote}|${parsedTrades[0].base}`;
	await api.addTrades(localPair, parsedTrades, false);
	expect(api.settings.supportWS).toEqual(true);
	expect((dbUtil.insertTradeData as jest.Mock).mock.calls).toMatchSnapshot();
});

test(`addTrades WS  no trade`, async () => {
	api.isInitialized = false;
	api.settings.supportWS = true;
	util.getUTCNowTimestamp = jest.fn(() => CST.TRADES_STATUS_LAST_UPDATE_INTERVAL_WS * 1000 + 1);
	dbUtil.insertTradeData = jest.fn(() => Promise.resolve());
	const localPair = `${parsedTrades[0].quote}|${parsedTrades[0].base}`;
	await api.addTrades(localPair, [], false);
	expect(api.settings.supportWS).toEqual(true);
	expect((dbUtil.insertTradeData as jest.Mock).mock.calls).toMatchSnapshot();
});

test(`addTrades WS no tradeStatusLastUpdatedAt`, async () => {
	api.isInitialized = false;
	api.settings.supportWS = true;
	util.getUTCNowTimestamp = jest.fn(() => CST.TRADES_STATUS_LAST_UPDATE_INTERVAL_WS * 1000 + 1);
	dbUtil.insertTradeData = jest.fn(() => Promise.resolve());
	const localPair = `${parsedTrades[0].quote}|${parsedTrades[0].base}`;
	api.tradeStatusLastUpdatedAt[localPair] = 1234567890000;
	await api.addTrades(localPair, parsedTrades, false);
	expect(api.settings.supportWS).toEqual(true);
	expect((dbUtil.insertTradeData as jest.Mock).mock.calls).toMatchSnapshot();
});

test(`fetchTrades WS `, async () => {
	api.settings.supportWS = true;
	api.settings.wsLink = 'ws://localhost:8080';

	api.handleWSTradeOpen = jest.fn();
	api.handleWSTradeMessage = jest.fn();
	global.setTimeout = jest.fn();
	const w = api.fetchTradesWS([`quote-base`]);
	w.removeAllListeners = jest.fn();
	w.terminate = jest.fn();
	expect((w.on as jest.Mock).mock.calls).toMatchSnapshot();
	(w.on as jest.Mock).mock.calls[0][1]();
	expect((api.handleWSTradeOpen as jest.Mock).mock.calls[0]).toMatchSnapshot();
	(w.on as jest.Mock).mock.calls[1][1]('message from ws server');
	expect((api.handleWSTradeMessage as jest.Mock).mock.calls[0]).toMatchSnapshot();

	(w.on as jest.Mock).mock.calls[2][1]('connection error');
	expect(w.removeAllListeners as jest.Mock).toBeCalledTimes(1);
	expect(w.terminate as jest.Mock).toBeCalledTimes(1);
	(w.on as jest.Mock).mock.calls[3][1]('close');
	expect(w.removeAllListeners as jest.Mock).toBeCalledTimes(2);
	expect(w.terminate as jest.Mock).toBeCalledTimes(2);

	expect((global.setTimeout as jest.Mock).mock.calls).toMatchSnapshot();
	api.fetchTradesWS = jest.fn();
	(global.setTimeout as jest.Mock).mock.calls[0][0]();
	(global.setTimeout as jest.Mock).mock.calls[1][0]();
	expect((api.fetchTradesWS as jest.Mock).mock.calls).toMatchSnapshot();
});

test(`fetchTrades, supportWs false`, async () => {
	api.isInitialized = false;
	api.settings.supportWS = false;
	api.fetchTradesREST = jest.fn(() => Promise.resolve());
	global.setInterval = jest.fn();
	await api.fetchTrades([`quote-base`]);
	expect((global.setInterval as jest.Mock).mock.calls).toMatchSnapshot();
	(global.setInterval as jest.Mock).mock.calls[0][0]();
	expect((api.fetchTradesREST as jest.Mock).mock.calls).toMatchSnapshot();
});

test(`fetchTrades, supportWs true`, async () => {
	api.isInitialized = false;
	api.settings.supportWS = true;
	api.fetchTradesREST = jest.fn(() => Promise.resolve());
	api.fetchTradesWS = jest.fn();
	global.setInterval = jest.fn();
	await api.fetchTrades([`quote-base`]);
	expect(api.fetchTradesREST as jest.Mock).not.toBeCalled();
});
