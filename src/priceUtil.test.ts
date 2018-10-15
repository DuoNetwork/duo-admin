import dynamoUtil from '../src/database/dynamoUtil';
import priceUtil from './priceUtil';
import util from './util';

test('getBasePeriod', () => {
	expect(priceUtil.getBasePeriod(1)).toBe(0);
	expect(priceUtil.getBasePeriod(60)).toBe(1);
	expect(() => priceUtil.getBasePeriod(2)).toThrowErrorMatchingSnapshot();
});

const prices = [
	{
		source: 'bitfinex',
		base: 'USD',
		quote: 'ETH',
		timestamp: 1535958681000,
		period: 0,
		open: 202,
		high: 210,
		low: 200,
		close: 205,
		volume: 0.0007
	},
	{
		source: 'kraken',
		base: 'USD',
		quote: 'ETH',
		timestamp: 1535958681000,
		period: 0,
		open: 207,
		high: 213,
		low: 200,
		close: 210,
		volume: 17.6757
	},
	{
		source: 'gemini',
		base: 'USD',
		quote: 'ETH',
		timestamp: 1535958609000,
		period: 0,
		open: 214,
		high: 220,
		low: 210,
		close: 215,
		volume: 0.0013
	}
];

const sortedPrices1 = priceUtil.sortPricesByPairPeriod(prices, 1);
const sortedPrices2 = priceUtil.sortPricesByPairPeriod(prices, 60);
test('sortPricesByPairPeriod 1', () => expect(sortedPrices1).toMatchSnapshot());
test('sortPricesByPairPeriod 60', () => expect(sortedPrices2).toMatchSnapshot());

test('getPeriodPrice 1', () => {
	for (const pair in sortedPrices1)
		for (const period in sortedPrices1[pair])
			expect(priceUtil.getPeriodPrice(sortedPrices1[pair][period], 1)).toMatchSnapshot();
});

test('getPeriodPrice 60', () => {
	for (const pair in sortedPrices2)
		for (const period in sortedPrices2[pair])
			expect(priceUtil.getPeriodPrice(sortedPrices2[pair][period], 60)).toMatchSnapshot();
});

test('aggregatePrice', async () => {
	dynamoUtil.getPrices = jest.fn((src: string) =>
		Promise.resolve(prices.filter(price => price.source === src))
	);
	dynamoUtil.addPrice = jest.fn();
	util.getUTCNowTimestamp = jest.fn(() => Math.max(...prices.map(price => price.timestamp)) + 1);

	await priceUtil.aggregatePrice(1);
	expect((dynamoUtil.addPrice as jest.Mock<Promise<boolean>>).mock.calls).toMatchSnapshot();
});
