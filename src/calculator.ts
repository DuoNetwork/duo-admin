import sqlUtil from './sqlUtil';
import * as CST from './constants';
import { Price, Trade } from './types';

export class Calculateor {
	getTradesForInterval(trades: Trade[], currentTimestamp: number, interval: number): Trade[] {
		const oneInterval = 5 * 60 * 1000;
		const upperTime: number = currentTimestamp - interval * oneInterval;
		const lowerTime: number = upperTime - oneInterval;

		return trades.filter(
			trade =>
				Number(trade.sourceTimestamp) <= upperTime &&
				Number(trade.sourceTimestamp) > lowerTime
		);
	}

	getVolumeMedianPrice(trades: Trade[]): { price: number; volume: number } {
		trades.sort((a, b) => Number(a.price) - Number(b.price));
		const cumVols: number[] = [];
		let cumVol = 0;
		trades.forEach((trade, index) => {
			cumVol += Number(trade.amount);
			cumVols[index] = cumVol;
		});
		const halfTotalVol: number = cumVol / 2;
		const medianIndex = cumVols.findIndex(v => v >= halfTotalVol);
		return { price: Number(trades[medianIndex].price), volume: cumVol };
	}

	getExchangePriceFix(
		trades: Trade[],
		currentTimestamp: number
	): { price: number; volume: number } {
		for (let i = 0; i < 12; i++) {
			const subTrades = this.getTradesForInterval(trades, currentTimestamp, i);
			if (subTrades.length > 0) return this.getVolumeMedianPrice(subTrades);
		}

		return { price: 0, volume: 0 };
	}

	getWeights(rawVolume: number[]): number[] {
		const totalVol = rawVolume.reduce((a, b) => a + b);
		const weightArray = rawVolume.map(v => v / totalVol);
		return weightArray;
	}

	validateWeights(weights: number[]): boolean {
		const numOfValidExchanges = weights.length;
		for (let i = 0; i < weights.length; i++)
			if (weights[i] > CST.EXCHANGE_WEIGHTAGE_TH[numOfValidExchanges][i]) return false;
		return true;
	}

	modifyWeights(weights: number[]): number[] {
		const numOfValidExchanges = weights.length;
		let isValid: boolean = this.validateWeights(weights);
		while (!isValid) {
			let sumOfCapped: number = 0;
			let sumOfUnCapped: number = 0;
			const weightCaps = CST.EXCHANGE_WEIGHTAGE_TH[numOfValidExchanges];
			for (let i = 0; i < weights.length; i++) {
				if (weights[i] >= weightCaps[i]) {
					weights[i] = weightCaps[i];
					sumOfCapped += weightCaps[i];
				} else {
					sumOfUnCapped += weights[i];
				}
			}

			for (let i = 0; i < weights.length; i++) {
				if (weights[i] < weightCaps[i]) {
					weights[i] = weights[i] / sumOfUnCapped * (1 - sumOfCapped);
				}
			}
			// console.log(weights);
			isValid = this.validateWeights(weights);
		}
		return weights;
	}

	consolidatePriceFix(exchangePriceVolume: Array<{ price: number; volume: number }>): number {
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
			console.log('there are ' + filterredExchanges.length + ' valid exchanges');
			const totalVol = volumeList.reduce((a, b) => a + b);
			const weights = volumeList.map(v => v / totalVol);
			const finalWeights: number[] = this.modifyWeights(weights);
			return finalWeights.reduce(
				(accum, w, index) => accum + exchangePriceVolume[index].price * w
			);
		}
	}

	async getPriceFix(): Promise<Price> {
		const currentTimestamp: number = Math.floor(Date.now());
		const trades = await sqlUtil.readSourceData(currentTimestamp);
		const EXCHANGES_TRADES: { [key: string]: Trade[] } = {
			[CST.EXCHANGE_BITFINEX]: [],
			[CST.EXCHANGE_GEMINI]: [],
			[CST.EXCHANGE_GDAX]: [],
			[CST.EXCHANGE_KRAKEN]: []
		};

		trades.forEach(item => {
			if (item.source === CST.EXCHANGE_BITFINEX)
				EXCHANGES_TRADES[CST.EXCHANGE_BITFINEX].push(item);
			else if (item.source === CST.EXCHANGE_GEMINI)
				EXCHANGES_TRADES[CST.EXCHANGE_GEMINI].push(item);
			else if (item.source === CST.EXCHANGE_GDAX)
				EXCHANGES_TRADES[CST.EXCHANGE_GDAX].push(item);
			else if (item.source === CST.EXCHANGE_KRAKEN)
				EXCHANGES_TRADES[CST.EXCHANGE_KRAKEN].push(item);
		});

		const exchangePriceVolume = CST.EXCHANGES.map(src =>
			this.getExchangePriceFix(EXCHANGES_TRADES[src], currentTimestamp)
		);

		const priceObj: Price = {
			price: '0',
			timestamp: '0'
		};
		const priceFix: number = this.consolidatePriceFix(exchangePriceVolume);

		if (priceFix === 0) {
			console.log('no priceFix found, use the last ETH price');
			sqlUtil.readLastPrice().then(lastPriceObj => {
				// resolve([priceObj.price, currentTimestamp]);
				priceObj.price = lastPriceObj.price;
				priceObj.timestamp = lastPriceObj.timestamp;
				console.log(
					'the priceFix is: ' + priceObj.price + ' at timestamp ' + priceObj.timestamp
				);
			});
		} else {
			console.log('the priceFix is: ' + priceFix + ' at timestamp ' + currentTimestamp);
			// save price into DB
			sqlUtil.insertPrice({
				price: priceFix + '',
				timestamp: currentTimestamp + ''
			});

			priceObj.price = priceFix + '';
			priceObj.timestamp = currentTimestamp + '';
			// return priceObj;
		}
		return priceObj;
	}
}
const calculateor = new Calculateor();
export default calculateor;
