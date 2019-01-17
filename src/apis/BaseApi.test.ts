import moment from 'moment';
// import ws from 'ws';
import * as CST from '../common/constants';
import { ISource } from '../common/types';
import dbUtil from '../utils/dbUtil';
import util from '../utils/util';

import sources from '../samples/testSources.json';

import { WebSocket, Server } from 'mock-socket';


import BaseApi from './BaseApi';

class Api extends BaseApi {
	public async fetchTradesREST(sourcePair: string) {
		util.logInfo(sourcePair);
	}
}
const api = new Api();

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
	util.getUTCNowTimestamp = jest.fn(
		() => CST.TRADES_STATUS_LAST_UPDATE_INTERVAL_WS * 1000 + 1
	);
	dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));
	const localPair = `${parsedTrades[0].quote}|${parsedTrades[0].base}`;
	await api.addTrades(localPair, parsedTrades, false);
	expect(api.settings.supportWS).toEqual(true);
	expect((dbUtil.insertTradeData as jest.Mock<void>).mock.calls).toMatchSnapshot();

});

test(`addTrades WS  no trade`, async () => {
	api.isInitialized = false;
	api.settings.supportWS = true;
	util.getUTCNowTimestamp = jest.fn(
		() => CST.TRADES_STATUS_LAST_UPDATE_INTERVAL_WS * 1000 + 1
	);
	dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));
	const localPair = `${parsedTrades[0].quote}|${parsedTrades[0].base}`;
	await api.addTrades(localPair, [], false);
	expect(api.settings.supportWS).toEqual(true);
	expect((dbUtil.insertTradeData as jest.Mock<void>).mock.calls).toMatchSnapshot();

});

test(`addTrades WS no tradeStatusLastUpdatedAt`, async () => {
	api.isInitialized = false;
	api.settings.supportWS = true;
	util.getUTCNowTimestamp = jest.fn(
		() => CST.TRADES_STATUS_LAST_UPDATE_INTERVAL_WS * 1000 + 1
	);
	dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));
	const localPair = `${parsedTrades[0].quote}|${parsedTrades[0].base}`;
	api.tradeStatusLastUpdatedAt[localPair] = 1234567890000;
	await api.addTrades(localPair, parsedTrades, false);
	expect(api.settings.supportWS).toEqual(true);
	expect((dbUtil.insertTradeData as jest.Mock<void>).mock.calls).toMatchSnapshot();
});

test(`fetchTrades WS `, async () => {

	const mockServer = new Server('ws://localhost:8080');
	jest.mock('ws', () => new WebSocket('ws://localhost:8080'));

	mockServer.on('connection', client => {
		client.send('test message');
	});

	api.settings.supportWS = true;
	api.settings.wsLink = 'ws://localhost:8080';

	api.handleWSTradeOpen = jest.fn();

	global.setTimeout = jest.fn();
	api.fetchTradesWS([`quote-base`]);
	setTimeout(() => mockServer.stop(), 200);
	
});

test(`fetchTrades, supportWs false`, async () => {
	api.isInitialized = false;
	api.settings.supportWS = false;
	api.fetchTradesREST = jest.fn(() => Promise.resolve({}));
	global.setInterval = jest.fn();
	await api.fetchTrades([`quote-base`]);
	expect((api.fetchTradesREST as jest.Mock).mock.calls).toMatchSnapshot();
});

test(`fetchTrades, supportWs true`, async () => {
	api.isInitialized = false;
	api.settings.supportWS = true;
	api.fetchTradesREST = jest.fn(() => Promise.resolve({}));
	api.fetchTradesWS = jest.fn();
	global.setInterval = jest.fn();
	await api.fetchTrades([`quote-base`]);
	expect(api.fetchTradesREST as jest.Mock).not.toBeCalled();
});



