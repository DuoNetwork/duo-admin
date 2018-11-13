// import moment from 'moment';
import BeethovanWapper from '../../../duo-contract-wrapper/src/BeethovanWapper';
import MagiWrapper from '../../../duo-contract-wrapper/src/MagiWrapper';
import apis from '../apis';
import * as CST from '../common/constants';
import { IBeethovanStates, IContractPrice, IOption, IPrice } from '../common/types';
import calculator from './calculator';
import dynamoUtil from './dynamoUtil';
import util from './util';
const schedule = require('node-schedule');

class PriceUtil {
	public async startCommitPrices(
		address: string,
		key: string,
		magiWrapper: MagiWrapper,
		option: IOption
	) {
		const startTime = new Date();
		const endTime = new Date(startTime.getTime() + 3500000);
		const commitStart = new Date(endTime.getTime() + 50000);
		const rule = new schedule.RecurrenceRule();
		rule.minute = 0;

		const isStarted = await magiWrapper.isStarted();

		if (!isStarted)
			// contract is in inception state; start contract first and then commit price
			schedule.scheduleJob({ start: startTime, end: endTime, rule }, async () => {
				const currentPrice = await calculator.getPriceFix(option.base, option.quote);
				const gasPrice = (await magiWrapper.web3Wrapper.getGasPrice()) || option.gasPrice;
				util.logInfo('gasPrice price ' + gasPrice + ' gasLimit is ' + option.gasLimit);
				return magiWrapper.startMagi(
					address,
					key,
					gasPrice,
					option.gasLimit + 50000,
					currentPrice.price,
					Math.floor(currentPrice.timestamp / 1000)
				);
			});

		schedule.scheduleJob({ start: !isStarted ? commitStart : startTime, rule }, async () => {
			const currentPrice = await calculator.getPriceFix(option.base, option.quote);
			const gasPrice = (await magiWrapper.web3Wrapper.getGasPrice()) || option.gasPrice;
			util.logInfo('gasPrice price ' + gasPrice + ' gasLimit is ' + option.gasLimit);
			return magiWrapper.commitPrice(
				address,
				key,
				currentPrice.price,
				Math.floor(currentPrice.timestamp / 1000),
				gasPrice,
				option.gasLimit
			);
		});
	}

	public async fetchPrice(
		address: string,
		key: string,
		beethovanWapper: BeethovanWapper,
		magiWrapper: MagiWrapper,
		option: IOption
	) {
		const isStarted = await magiWrapper.isStarted();
		if (!isStarted) {
			util.logDebug('Magi not ready, please start Magi first');
			return;
		}
		const state: IBeethovanStates = await beethovanWapper.getStates();
		const startTime = new Date();
		const endTime = new Date(startTime.getTime() + 3500000);
		const commitStart = new Date(endTime.getTime() + 50000);
		const rule = new schedule.RecurrenceRule();
		rule.minute = 0;
		if (state.state === CST.CTD_INCEPTION)
			schedule.scheduleJob({ start: startTime, end: endTime, rule }, async () => {
				const gasPrice = (await magiWrapper.web3Wrapper.getGasPrice()) || option.gasPrice;
				util.logInfo('gasPrice price ' + gasPrice + ' gasLimit is ' + option.gasLimit);
				return beethovanWapper.startCustodian(
					address,
					key,
					option.live ? CST.BEETHOVAN_A_ADDR_MAIN : CST.BEETHOVAN_A_ADDR_KOVAN,
					option.live ? CST.BEETHOVAN_B_ADDR_MAIN : CST.BEETHOVAN_B_ADDR_KOVAN,
					option.live ? CST.MAGI_ADDR_MAIN : CST.MAGI_ADDR_KOVAN,
					gasPrice,
					option.gasLimit
				);
			});

		schedule.scheduleJob({ start: !isStarted ? commitStart : startTime, rule }, async () => {
			// first checking Magi current time is set correctly
			const lastPrice: IContractPrice = await magiWrapper.getLastPrice();
			let done = false;
			const currentBlkTime = await magiWrapper.web3Wrapper.getCurrentBlockTime();
			if (currentBlkTime - lastPrice.timestamp > 3600)
				util.logDebug('magi price not updated, pls wait');

			let blkTime = currentBlkTime;
			const gasPrice = (await magiWrapper.web3Wrapper.getGasPrice()) || option.gasPrice;
			while (!done && blkTime - lastPrice.timestamp < 100) {
				// within 100 seconds tolerance, save to proceed fetching
				await beethovanWapper.fetchPrice(address, key, gasPrice, option.gasLimit);

				const btvStates: IBeethovanStates = await beethovanWapper.getStates();
				if (btvStates.lastPriceTime - lastPrice.timestamp < 30) done = true;

				blkTime = await magiWrapper.web3Wrapper.getCurrentBlockTime();
			}
		});
	}

	public getBasePeriod(period: number) {
		if (period === 1) return 0;
		if (period === 60) return 1;

		throw new Error('invalid period');
	}

	public sortPricesByPairPeriod(
		prices: IPrice[],
		period: number
	): { [pair: string]: { [timestamp: number]: IPrice[] } } {
		const pairPrices: { [pair: string]: { [timestamp: number]: IPrice[] } } = {};
		prices.forEach(price => {
			const pair = price.quote + '|' + price.base;
			const timestamp = Math.floor(price.timestamp / 60000 / period);
			if (!pairPrices[pair]) pairPrices[pair] = {};
			if (!pairPrices[pair][timestamp]) pairPrices[pair][timestamp] = [];
			pairPrices[pair][timestamp].push(price);
		});
		return pairPrices;
	}

	public getPeriodPrice(prices: IPrice[], period: number): IPrice {
		prices.sort((a, b) => a.timestamp - b.timestamp);
		const first = prices[0];
		const last = prices[prices.length - 1];
		prices.sort((a, b) => -a.high + b.high);
		const high = prices[0];
		prices.sort((a, b) => a.low - b.low);
		const low = prices[0];
		return {
			source: first.source,
			open: first.open,
			high: high.high,
			low: low.low,
			close: last.close,
			volume: prices.reduce((sum, p) => sum + p.volume, 0),
			timestamp: Math.floor(first.timestamp / 60000 / period) * 60000 * period,
			period: period,
			quote: first.quote,
			base: first.base
		};
	}

	public async aggregatePrice(period: number) {
		util.logDebug(`priceUtil.aggregatePrice(${period})`);
		const now = util.getUTCNowTimestamp();
		const start = util.getPeriodStartTimestamp(now, period);
		for (const src in apis) {
			util.logInfo('------------------');
			util.logInfo(
				`[${src}]: To aggreate period:${String(
					period
				)} prices from timestamp ${util.timestampToString(start)}`
			);
			util.logInfo(
				`[${src}]: querying basePeriod:${this.getBasePeriod(
					period
				)} prices from timestamp ${util.timestampToString(start)}`
			);
			const basePrices = await dynamoUtil.getPrices(
				src,
				this.getBasePeriod(period),
				start,
				now
			);
			util.logInfo(`fetched ${basePrices.length} basePeriod prices`);
			const pairPeriodPrices = this.sortPricesByPairPeriod(basePrices, period);
			const pairPrices: { [pair: string]: IPrice[] } = {};
			for (const pair in pairPeriodPrices)
				for (const pd in pairPeriodPrices[pair]) {
					const periodPrices = pairPeriodPrices[pair][pd];
					if (periodPrices.length) {
						if (!pairPrices[pair]) pairPrices[pair] = [];
						pairPrices[pair].push(this.getPeriodPrice(periodPrices, period));
					}
				}

			util.logInfo('finished process, updating database');
			for (const pair in pairPrices)
				for (const price of pairPrices[pair]) await dynamoUtil.addPrice(price);
		}

		util.logInfo('all source processed');
	}

	public startAggregate(period: number) {
		// console.log({ period: period + '' });
		dynamoUtil.insertHeartbeat({ period: { N: period + '' } });

		setInterval(
			() => dynamoUtil.insertHeartbeat({ period: { N: period + '' } }),
			CST.STATUS_INTERVAL * 1000
		);
		setInterval(() => this.aggregatePrice(period), 30000);
	}
}

const priceUtil = new PriceUtil();

export default priceUtil;
