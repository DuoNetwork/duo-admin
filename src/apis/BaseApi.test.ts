import moment from 'moment';
import apis from '../apis';
import * as CST from '../common/constants';
import { ISource } from '../common/types';
import dbUtil from '../utils/dbUtil';
import util from '../utils/util';

import sources from '../samples/testSources.json';

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

for (const source in apis) {
	const api = apis[source];
	api.isInitialized = true;
	api.init();
	api.assetsInfo = (sources as { [key: string]: ISource })[api.source].assets;
	api.settings = (sources as { [key: string]: ISource })[api.source].settings;
	expect(api.settings).toMatchSnapshot();
}

for (const source in apis) {
	const api = apis[source];
	api.isInitialized = false;
	api.init();
	api.assetsInfo = (sources as { [key: string]: ISource })[api.source].assets;
	api.settings = (sources as { [key: string]: ISource })[api.source].settings;

	test(`getSourcePairs ${source} `, async () => {
		if (Object.keys(api.assetsInfo).length)
			api.assetsInfo = {
				baseTicker: {
					base: {},
					quote: { quoteTicker: true },
					mapping: 'base',
					name: 'base name'
				},
				quoteTicker: {
					base: { baseTicker: true },
					quote: {},
					mapping: 'quote',
					name: 'quote name'
				},
				otherTicker: {
					base: { baseTicker: true },
					quote: {},
					mapping: '',
					name: 'other name'
				}
			};

		util.getUTCNowTimestamp = jest.fn(() => moment.utc('20180924').valueOf());
		const sourceInstruments = api.getSourcePairs(['quote', 'base']);
		expect(sourceInstruments).toMatchSnapshot();
	});

	//
	test(`addTrades WS ${source} `, async () => {
		api.isInitialized = false;

		api.init();
		api.assetsInfo = (sources as { [key: string]: ISource })[api.source].assets;
		api.settings = (sources as { [key: string]: ISource })[api.source].settings;
		if (api.settings.supportWS) {
			util.getUTCNowTimestamp = jest.fn(
				() => CST.TRADES_STATUS_LAST_UPDATE_INTERVAL_WS * 1000 + 1
			);
			dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));

			const localPair = `${parsedTrades[0].quote}|${parsedTrades[0].base}`;

			await api.addTrades(localPair, parsedTrades, false);
			expect(api.settings.supportWS).toEqual(true);
			expect((dbUtil.insertTradeData as jest.Mock<void>).mock.calls).toMatchSnapshot();
		}
	});

	//
	test(`addTrades WS ${source} no trade`, async () => {
		api.isInitialized = false;

		api.init();
		api.assetsInfo = (sources as { [key: string]: ISource })[api.source].assets;
		api.settings = (sources as { [key: string]: ISource })[api.source].settings;
		if (api.settings.supportWS) {
			util.getUTCNowTimestamp = jest.fn(
				() => CST.TRADES_STATUS_LAST_UPDATE_INTERVAL_WS * 1000 + 1
			);
			dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));

			const localPair = `${parsedTrades[0].quote}|${parsedTrades[0].base}`;

			await api.addTrades(localPair, [], false);
			expect(api.settings.supportWS).toEqual(true);
			expect((dbUtil.insertTradeData as jest.Mock<void>).mock.calls).toMatchSnapshot();
		}
	});

	test(`addTrades WS ${source} no tradeStatusLastUpdatedAt`, async () => {
		api.isInitialized = false;

		api.init();
		api.assetsInfo = (sources as { [key: string]: ISource })[api.source].assets;
		api.settings = (sources as { [key: string]: ISource })[api.source].settings;
		if (api.settings.supportWS) {
			util.getUTCNowTimestamp = jest.fn(
				() => CST.TRADES_STATUS_LAST_UPDATE_INTERVAL_WS * 1000 + 1
			);
			dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));
			const localPair = `${parsedTrades[0].quote}|${parsedTrades[0].base}`;
			api.tradeStatusLastUpdatedAt[localPair] = 1234567890000;
			await api.addTrades(localPair, parsedTrades, false);
			expect(api.settings.supportWS).toEqual(true);
			expect((dbUtil.insertTradeData as jest.Mock<void>).mock.calls).toMatchSnapshot();
		}
	});

	test(`addTrades REST ${source} - filterBy (${
		api.settings.filterByTimestamp ? 'timestamp > 1234567891' : 'id > ID_1'
	}) `, async () => {
		api.isInitialized = false;
		api.init();
		api.assetsInfo = (sources as { [key: string]: ISource })[api.source].assets;
		api.settings = (sources as { [key: string]: ISource })[api.source].settings;
		api.settings.supportWS = false;

		util.getUTCNowTimestamp = jest.fn(() => CST.TRADES_STATUS_LAST_UPDATE_INTERVAL_WS * 1000); // expect to have no effect
		dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));

		const localPair = `${parsedTrades[0].quote}|${parsedTrades[0].base}`;
		api.last[localPair] = api.settings.filterByTimestamp ? '1234567891' : 'ID_1';

		await api.addTrades(localPair, parsedTrades);
		expect(api.settings.supportWS).toBe(false);
		expect((dbUtil.insertTradeData as jest.Mock<void>).mock.calls).toMatchSnapshot();
	});

	// test(`fetchTrades WS ${source} `, async () => {
	// 	// jest.fn(() => ({
	// 	// 	open: api.handleWSTradeOpen([`${source}quote-${source}base`], {} as any),
	// 	// 	message: api.handleWSTradeMessage('message', {} as any),
	// 	// 	close: jest.fn(),
	// 	// 	error: jest.fn()
	// 	// }))
	// 	jest.mock('ws', () => {
	// 		return jest.fn().mockImplementation(() => {
	// 			return { on: jest.fn(() => console.log('111111111111')) };
	// 		});
	// 	});
	// 	if (api.settings.supportWS) {
	// 		console.log('################ start ws test');
	// 		global.setTimeout = jest.fn();
	// 		api.handleWSTradeOpen = jest.fn();
	// 		api.handleWSTradeMessage = jest.fn();
	// 		api.fetchTradesREST = jest.fn(() => Promise.resolve());
	// 		global.setInterval = jest.fn();

	// 		api.isInitialized = false;
	// 		api.init();
	// 		await api.fetchTradesWS([`${source}quote-${source}base`]);
	// 	}

	// 	// expect((api.fetchTradesREST as jest.Mock).mock.calls).toMatchSnapshot();
	// });

	test(`fetchTrades ${source} `, async () => {
		api.isInitialized = false;
		api.init();
		api.fetchTradesREST = jest.fn(() => Promise.resolve({}));
		// api.fetchTradesWS = jest.fn();
		global.setInterval = jest.fn();
		await api.fetchTrades([`${source}quote-${source}base`]);
		expect((api.fetchTradesREST as jest.Mock).mock.calls).toMatchSnapshot();
	});
}
