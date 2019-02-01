import {Constants, IPriceFix, ITrade} from '@finbook/duo-market-data'
import * as CST from '../common/constants';
import dbUtil from './dbUtil';
import util from './util';

class Calculateor {
	public getTradesForInterval(
		trades: ITrade[],
		currentTimestamp: number,
		interval: number
	): ITrade[] {
		const oneInterval = 5 * 60 * 1000;
		const upperTime: number = currentTimestamp - interval * oneInterval;
		const lowerTime: number = upperTime - oneInterval;

		return trades.filter(
			trade => Number(trade.timestamp) <= upperTime && Number(trade.timestamp) > lowerTime
		);
	}

	public getVolumeMedianPrice(trades: ITrade[], timestamp: number): IPriceFix {
		trades.sort((a, b) => Number(a.price) - Number(b.price));
		const cumVols: number[] = [];
		let cumVol = 0;
		trades.forEach((trade, index) => {
			cumVol += Number(trade.amount);
			cumVols[index] = cumVol;
		});
		const halfTotalVol: number = cumVol / 2;
		const medianIndex = cumVols.findIndex(v => v >= halfTotalVol);
		return {
			price: Number(trades[medianIndex].price),
			volume: cumVol,
			timestamp,
			source: '',
			base: trades[0].base,
			quote: trades[0].quote
		};
	}

	public getExchangePriceFix(trades: ITrade[], currentTimestamp: number): IPriceFix {
		for (let i = 0; i < 12; i++) {
			const subTrades = this.getTradesForInterval(trades, currentTimestamp, i);
			if (subTrades.length > 0) return this.getVolumeMedianPrice(subTrades, currentTimestamp);
		}

		return {
			price: 0,
			volume: 0,
			timestamp: currentTimestamp,
			source: '',
			base: '',
			quote: ''
		};
	}

	public getWeights(rawVolume: number[]): number[] {
		const totalVol = rawVolume.reduce((a, b) => a + b, 0);
		const weightArray = rawVolume.map(v => v / totalVol);
		return weightArray;
	}

	public validateWeights(weights: number[]): boolean {
		const numOfValidExchanges = weights.length;
		for (let i = 0; i < weights.length; i++)
			if (weights[i] > CST.EXCHANGE_WEIGHTAGE_TH[numOfValidExchanges][i]) return false;

		return true;
	}

	public modifyWeights(weights: number[]): number[] {
		const numOfValidExchanges = weights.length;
		let isValid: boolean = this.validateWeights(weights);
		while (!isValid) {
			let sumOfCapped: number = 0;
			let sumOfUnCapped: number = 0;
			const weightCaps = CST.EXCHANGE_WEIGHTAGE_TH[numOfValidExchanges];
			for (let i = 0; i < weights.length; i++)
				if (weights[i] >= weightCaps[i]) {
					weights[i] = weightCaps[i];
					sumOfCapped += weightCaps[i];
				} else sumOfUnCapped += weights[i];

			for (let i = 0; i < weights.length; i++)
				if (weights[i] < weightCaps[i])
					weights[i] = (weights[i] / sumOfUnCapped) * (1 - sumOfCapped);

			isValid = this.validateWeights(weights);
		}
		return weights;
	}

	public consolidatePriceFix(exchangePriceVolume: IPriceFix[]): number {
		const filterredExchanges = exchangePriceVolume.filter(item => item.volume > 0);

		// sort based on volume from large to small
		filterredExchanges.sort((a, b) => b.volume - a.volume);
		const volumeList = filterredExchanges.map(item => item.volume);

		if (filterredExchanges.length === 0)
			// use previous priceFix
			return 0;
		else if (filterredExchanges.length === 1)
			// let finalArray: number[] = [];
			return filterredExchanges[0].price;
		else {
			util.logInfo('there are ' + filterredExchanges.length + ' valid exchanges');
			const totalVol = volumeList.reduce((a, b) => a + b, 0);
			const weights = volumeList.map(v => v / totalVol);
			const finalWeights: number[] = this.modifyWeights(weights);
			return finalWeights.reduce(
				(accum, w, index) => accum + filterredExchanges[index].price * w,
				0
			);
		}
	}

	public async getPriceFix(quote: string, base: string): Promise<IPriceFix> {
		const currentTimestamp: number = util.getUTCNowTimestamp();
		const trades = await dbUtil.readSourceData(currentTimestamp, base, quote);
		const EXCHANGES_TRADES: { [key: string]: ITrade[] } = {
			[Constants.API_BITFINEX]: [],
			[Constants.API_GEMINI]: [],
			[Constants.API_GDAX]: [],
			[Constants.API_KRAKEN]: [],
			[Constants.API_BITSTAMP]: []
		};

		trades.forEach(item => {
			if (item.source === Constants.API_BITFINEX)
				EXCHANGES_TRADES[Constants.API_BITFINEX].push(item);
			else if (item.source === Constants.API_GEMINI)
				EXCHANGES_TRADES[Constants.API_GEMINI].push(item);
			else if (item.source === Constants.API_GDAX)
				EXCHANGES_TRADES[Constants.API_GDAX].push(item);
			else if (item.source === Constants.API_KRAKEN)
				EXCHANGES_TRADES[Constants.API_KRAKEN].push(item);
			else if (item.source === Constants.API_BITSTAMP)
				EXCHANGES_TRADES[Constants.API_BITSTAMP].push(item);
		});

		const exchangePriceVolume = CST.API_LIST.map(src =>
			this.getExchangePriceFix(EXCHANGES_TRADES[src], currentTimestamp)
		);

		const priceFix: number = this.consolidatePriceFix(exchangePriceVolume);
		util.logInfo('priceFix calculated is ' + priceFix);

		if (priceFix === 0) {
			util.logInfo('no priceFix found, use the last ETH price');
			const lastPriceObj = await dbUtil.readLastPrice(base, quote);
			util.logInfo(
				'the priceFix is: ' + lastPriceObj.price + ' at timestamp ' + lastPriceObj.timestamp
			);
			return lastPriceObj;
		} else {
			const priceObj = {
				price: priceFix,
				volume: exchangePriceVolume.reduce((sum, p) => sum + p.volume, 0),
				timestamp: currentTimestamp,
				source: '',
				base: base,
				quote: quote
			};
			util.logInfo(
				'valid exchange priceFix found: ' +
					priceObj.price +
					' at ' +
					priceObj.timestamp +
					' for volume of ' +
					priceObj.volume
			);
			// save price into DB
			await dbUtil.insertPrice(priceObj);

			return priceObj;
		}
	}
}
const calculator = new Calculateor();
export default calculator;
