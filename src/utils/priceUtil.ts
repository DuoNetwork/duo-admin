import {
	Constants as WrapperConstants,
	DualClassWrapper,
	IContractPrice,
	IDualClassStates,
	MagiWrapper
} from '@finbook/duo-contract-wrapper';
import { IPrice } from '@finbook/duo-market-data';
import apis from '../apis';
import calculator from './calculator';
import dbUtil from './dbUtil';
import util from './util';
const schedule = require('node-schedule');

class PriceUtil {
	public async startCommitPrices(
		account: string,
		magiWrapper: MagiWrapper,
		pair: string,
		gasPrice: number = 0
	) {
		const startTime = util.getUTCNowTimestamp();
		const endTime = startTime.valueOf() + 3500000;
		const commitStart = endTime + 50000;
		const rule = new schedule.RecurrenceRule();
		rule.minute = 0;

		const isStarted = await magiWrapper.isStarted();

		if (!isStarted)
			// contract is in inception state; start contract first and then commit price
			schedule.scheduleJob({ start: startTime, end: endTime, rule }, () =>
				this.startMagi(account, magiWrapper, pair, gasPrice)
			);

		schedule.scheduleJob({ start: !isStarted ? commitStart : startTime, rule }, () =>
			this.commitPrice(account, magiWrapper, pair, gasPrice)
		);
	}

	public async startMagi(
		account: string,
		magiWrapper: MagiWrapper,
		pair: string,
		gasPrice: number = 0
	) {
		const [quote, base] = pair.split('|');
		const currentPrice = await calculator.getPriceFix(quote, base);
		if (!gasPrice) gasPrice = Number(await magiWrapper.web3Wrapper.getGasPrice());
		util.logInfo(
			'gasPrice price ' + gasPrice + ' gasLimit is ' + WrapperConstants.START_MAGI_GAS
		);
		return magiWrapper.startMagi(
			account,
			currentPrice.price,
			Math.floor(currentPrice.timestamp / 1000),
			{
				gasPrice: gasPrice,
				gasLimit: WrapperConstants.START_MAGI_GAS
			}
		);
	}

	public async commitPrice(
		account: string,
		magiWrapper: MagiWrapper,
		pair: string,
		gasPrice: number = 0
	) {
		const [quote, base] = pair.split('|');
		const currentPrice = await calculator.getPriceFix(quote, base);
		const isLive = magiWrapper.web3Wrapper.isLive();

		let currentBlkTime = 0;
		let ready = false;
		while (!ready) {
			currentBlkTime = await magiWrapper.web3Wrapper.getBlockTimestamp();
			if (currentPrice.timestamp <= currentBlkTime) ready = true;
			else await util.sleep(5000);
		}

		if (!gasPrice) {
			const networkGasPrice = Number(await magiWrapper.web3Wrapper.getGasPrice());
			gasPrice = isLive ? networkGasPrice * 1.5 : networkGasPrice;
		}

		util.logInfo(
			'gasPrice price ' + gasPrice + ' gasLimit is ' + WrapperConstants.COMMIT_PRICE_GAS
		);

		magiWrapper.commitPrice(
			account,
			currentPrice.price,
			Math.floor(currentPrice.timestamp / 1000),
			{
				gasPrice: gasPrice,
				gasLimit: WrapperConstants.COMMIT_PRICE_GAS
			}
		);
	}

	public async fetchPrice(
		account: string,
		dualClassWrappers: DualClassWrapper[],
		magiWrapper: MagiWrapper,
		gasPrice: number = 0
	) {
		const isStarted = await magiWrapper.isStarted();
		const isLive = magiWrapper.web3Wrapper.isLive();
		if (!isStarted) {
			util.logDebug('Magi not ready, please start Magi first');
			return;
		}
		let nonce = await dualClassWrappers[0].web3Wrapper.getTransactionCount(account);
		global.setInterval(
			async () => {
				// first checking Magi current time is set correctly
				const lastPrice: IContractPrice = await magiWrapper.getLastPrice();
				const promiseList: Array<Promise<void>> = [];
				const wrappersToCall: DualClassWrapper[] = [];

				for (const bw of dualClassWrappers) {
					const btvStates: IDualClassStates = await bw.getStates();
					if (
						btvStates.state === WrapperConstants.CTD_TRADING &&
						lastPrice.timestamp - btvStates.lastPriceTime > 3000000
					)
						wrappersToCall.push(bw);
				}
				const networkGasPrice = Number(await magiWrapper.web3Wrapper.getGasPrice());
				if (!gasPrice) gasPrice = isLive ? networkGasPrice * 1.5 : networkGasPrice;
				for (const bw of wrappersToCall) {
					promiseList.push(
						bw.fetchPrice(account, {
							gasPrice: gasPrice,
							gasLimit: WrapperConstants.FETCH_PRICE_GAS,
							nonce: nonce
						})
					);
					nonce++;
				}

				await Promise.all(promiseList);
			},
			isLive ? 30000 : 15000
		);
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
			const basePrices = await dbUtil.getPrices(src, this.getBasePeriod(period), start, now);
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
				for (const price of pairPrices[pair]) await dbUtil.addPrice(price);
		}

		util.logInfo('all source processed');
	}
}

const priceUtil = new PriceUtil();

export default priceUtil;
