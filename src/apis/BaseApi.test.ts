import moment from 'moment';
import apis from '../apis';
import * as CST from '../common/constants';
import dbUtil from '../utils/dbUtil';
import util from '../utils/util';

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
	api.isInitialized = false;
	api.init();

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

	test(`addTrades REST ${source} - filterBy (${
		api.settings.filterByTimestamp ? 'timestamp > 1234567891' : 'id > ID_1'
	}) `, async () => {
		api.isInitialized = false;
		api.init();
		api.settings.supportWS = false;

		util.getUTCNowTimestamp = jest.fn(() => CST.TRADES_STATUS_LAST_UPDATE_INTERVAL_WS * 1000); // expect to have no effect
		dbUtil.insertTradeData = jest.fn(() => Promise.resolve({}));

		const localPair = `${parsedTrades[0].quote}|${parsedTrades[0].base}`;
		api.last[localPair] = api.settings.filterByTimestamp ? '1234567891' : 'ID_1';

		await api.addTrades(localPair, parsedTrades);
		expect(api.settings.supportWS).toBe(false);
		expect((dbUtil.insertTradeData as jest.Mock<void>).mock.calls).toMatchSnapshot();
	});
}
