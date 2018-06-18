import trades from '../samples/gdax.json';
import gdaxUtil from './gdaxUtil';

test('parseTrade', () => {
	trades.forEach(async trade => {
		const parsedTrade = gdaxUtil.parseTrade(trade);
		expect(parsedTrade).toMatchSnapshot();
	});
});
