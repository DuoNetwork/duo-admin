import calculator from './calculator';
import * as CST from './constants';
import sqlUtil from './sqlUtil';
import { ITrade } from './types';
const trades: ITrade[] = require('./samples/ETHUSDtrades.json');
const trades2: ITrade[] = require('./samples/ETHUSDtrades2.json');
// console.log(trades);

test('getVolumeMedianPrice', () => {
	CST.EXCHANGES.forEach(exchange => {
		const exchangeTrades: ITrade[] = trades.filter(item => item.source === exchange);
		expect(calculator.getVolumeMedianPrice(exchangeTrades, 1234567890)).toMatchSnapshot();
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
	CST.EXCHANGES.forEach(exchange => {
		const exchangeTrades: ITrade[] = trades.filter(item => item.source === exchange);
		const timestamp = exchangeTrades.reduce(
			(min, p) => (Number(p.timestamp) < min ? Number(p.timestamp) : min),
			Number(exchangeTrades[0].timestamp)
		);
		expect(calculator.getExchangePriceFix(exchangeTrades, timestamp)).toMatchSnapshot();
	});
});

test('getPriceFix case 1', async () => {
	sqlUtil.readSourceData = jest.fn(() => Promise.resolve(trades));
	sqlUtil.insertPrice = jest.fn(() => Promise.resolve());
	Date.now = jest.fn(() => 1524547909941);
	// console.log(sqlUtil.readSourceData);
	await calculator.getPriceFix();
	expect((sqlUtil.insertPrice as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('getPriceFix case 2', async () => {
	sqlUtil.readSourceData = jest.fn(() => Promise.resolve(trades2));
	sqlUtil.insertPrice = jest.fn(() => Promise.resolve());
	Date.now = jest.fn(() => 1524547909941);
	// console.log(sqlUtil.readSourceData);
	await calculator.getPriceFix();
	expect((sqlUtil.insertPrice as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});
