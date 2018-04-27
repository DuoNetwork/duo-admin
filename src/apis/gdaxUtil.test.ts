import gdaxUtil from './gdaxUtil';
const trades: Array<{ [key: string]: string }> = require('../samples/gdax.json');

test('parseTrade', () => {
	trades.forEach(async trade => {
		const parsedTrade = gdaxUtil.parseTrade(trade);
		expect(parsedTrade).toMatchSnapshot();
	});
});