import calculator from './calculator';
import * as CST from './constants';
import { Trade } from './types';
import sqlUtil from './sqlUtil';
const trades: Trade[] = require('./samples/ETHUSDtrades.json');
// console.log(trades);

test('getVolumeMedianPrice', () => {
	CST.EXCHANGES.forEach( exchange => {
		const exchange_trades: Trade[] = trades.filter(item => item.source === exchange);
		expect(calculator.getVolumeMedianPrice(exchange_trades)).toMatchSnapshot();

	});
});

test('modifyWeights', () => {
	let inputWeightage: number[] = [0.5, 0.4, 0.05, 0.05];
	expect(calculator.modifyWeights(inputWeightage)).toMatchSnapshot();

	inputWeightage = [0.7, 0.2, 0.1];
	expect(calculator.modifyWeights(inputWeightage)).toMatchSnapshot();


	inputWeightage = [0.8, 0.2];
	expect(calculator.modifyWeights(inputWeightage)).toMatchSnapshot();
});

test('getExchangePriceFix', () => {
	CST.EXCHANGES.forEach( exchange => {
		const exchange_trades: Trade[] = trades.filter(item => item.source === exchange);
		const timestamp = exchange_trades.reduce((min, p) => Number(p.sourceTimestamp) < min ? Number(p.sourceTimestamp) : min, Number(exchange_trades[0].sourceTimestamp));
		expect(calculator.getExchangePriceFix(exchange_trades, timestamp )).toMatchSnapshot();
	});

});

test('getPriceFix', async () => {
	sqlUtil.readSourceData = jest.fn(() => Promise.resolve(trades));
	// console.log(sqlUtil.readSourceData);
	await calculator.getPriceFix();
	expect(
		(sqlUtil.readSourceData as jest.Mock<Promise<Trade[]>>).mock.calls[0]
	).toMatchSnapshot();

});


