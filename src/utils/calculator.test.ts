
import * as CST from '../common/constants';
import { ITrade } from '../common/types';
import trades from '../samples/ETHUSDtrades.json';
import trades2 from '../samples/ETHUSDtrades2.json';
import calculator from './calculator';
import dbUtil from './dbUtil';
import util from './util';

test('getVolumeMedianPrice', () => {
	CST.API_LIST.forEach(exchange => {
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
	CST.API_LIST.forEach(exchange => {
		const exchangeTrades: ITrade[] = trades.filter(item => item.source === exchange);
		const timestamp = exchangeTrades.reduce(
			(min, p) => (Number(p.timestamp) < min ? Number(p.timestamp) : min),
			Number(exchangeTrades[0].timestamp)
		);
		expect(calculator.getExchangePriceFix(exchangeTrades, timestamp)).toMatchSnapshot();
	});
});

test('getPriceFix case 1', async () => {
	dbUtil.readSourceData = jest.fn(() => Promise.resolve(trades));
	dbUtil.insertPrice = jest.fn(() => Promise.resolve());
	util.getNowTimestamp = jest.fn(() => 1524547909941);
	await calculator.getPriceFix('USD', 'ETH');
	expect((dbUtil.insertPrice as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});

test('getPriceFix case 2', async () => {
	dbUtil.readSourceData = jest.fn(() => Promise.resolve(trades2));
	dbUtil.insertPrice = jest.fn(() => Promise.resolve());
	util.getNowTimestamp = jest.fn(() => 1524547909941);
	await calculator.getPriceFix('USD', 'ETH');
	expect((dbUtil.insertPrice as jest.Mock<Promise<void>>).mock.calls[0][0]).toMatchSnapshot();
});
