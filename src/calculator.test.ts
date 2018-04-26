import calculateor from './calculator';
import * as CST from './constants';
const trades: Array<{ [key: string]: string }> = require('./samples/ETHUSDtrades.json');

test('test getVolumeMedianPrice', () => {
	CST.EXCHANGES.forEach( exchange => {
		const exchange_trades: Array<{ [key: string]: string }> = trades.filter(item => item['exchange_source'] === exchange);
		let medianPrice: number;
		let volume: number;
		[medianPrice, volume] = calculateor.getVolumeMedianPrice(exchange_trades);
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
		const exchange_trades: Array<{ [key: string]: string }> = trades.filter(item => item['exchange_source'] === exchange);
		const timestamp = exchange_trades.reduce((min, p) => Number(p.exchange_returned_timestamp) < min ? Number(p.exchange_returned_timestamp) : min, Number(exchange_trades[0].exchange_returned_timestamp));
		expect(calculateor.getExchangePriceFix(exchange_trades, timestamp, exchange )).toMatchSnapshot();
		expect(calculateor.getExchangePriceFix([{}], timestamp, exchange )).toMatchSnapshot();
	});

});



