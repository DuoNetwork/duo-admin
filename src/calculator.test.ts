import calculateor from './calculator';
import * as CST from './constants';
import { Trade } from './types';
const trades: Trade[] = require('./samples/ETHUSDtrades.json');
// console.log(trades);

test('test getVolumeMedianPrice', () => {
	CST.EXCHANGES.forEach( exchange => {
		const exchange_trades: Trade[] = trades.filter(item => item.source === exchange);
		let medianPrice: number;
		let volume: number;
		[medianPrice, volume] = calculateor.getVolumeMedianPrice(exchange_trades);
		// console.log([medianPrice, volume]);
		expect(medianPrice).toMatchSnapshot();
		const volumeSum: number = exchange_trades.reduce((a, b) => a + Number(b.amount), 0 );
		expect(volume).toBe(volumeSum / 2);

	});

});

test('test normalizeWeightage', () => {
	const volumeList: number[] = [ 100, 200, 300, 400];
	expect(calculateor.normalizeWeightage(volumeList)).toMatchSnapshot();
});

test('test modifyWeightage', () => {
	let inputWeightage: number[] = [0.5, 0.4, 0.05, 0.05];
	expect(calculateor.modifyWeightage(inputWeightage)).toMatchSnapshot();

	inputWeightage = [0.7, 0.2, 0.1];
	expect(calculateor.modifyWeightage(inputWeightage)).toMatchSnapshot();


	inputWeightage = [0.8, 0.2];
	expect(calculateor.modifyWeightage(inputWeightage)).toMatchSnapshot();
});

test('test getExchangePriceFix', () => {
	CST.EXCHANGES.forEach( exchange => {
		const exchange_trades: Trade[] = trades.filter(item => item.source === exchange);
		const timestamp = exchange_trades.reduce((min, p) => Number(p.sourceTimestamp) < min ? Number(p.sourceTimestamp) : min, Number(exchange_trades[0].sourceTimestamp));
		expect(calculateor.getExchangePriceFix(exchange_trades, timestamp, exchange )).toMatchSnapshot();
	});

});



