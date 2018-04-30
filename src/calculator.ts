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
				Number(trade.timestamp) <= upperTime &&
				Number(trade.timestamp) > lowerTime
		);
	}

	getVolumeMedianPrice(trades: Trade[], timestamp: number): Price {
		trades.sort((a, b) => Number(a.price) - Number(b.price));
		const cumVols: number[] = [];
		let cumVol = 0;
		trades.forEach((trade, index) => {
			cumVol += Number(trade.amount);
			cumVols[index] = cumVol;
		});
		const halfTotalVol: number = cumVol / 2;
		const medianIndex = cumVols.findIndex(v => v >= halfTotalVol);
		return { price: Number(trades[medianIndex].price), volume: cumVol, timestamp: timestamp };
	}

	getExchangePriceFix(trades: Trade[], currentTimestamp: number): Price {
		for (let i = 0; i < 12; i++) {
			const subTrades = this.getTradesForInterval(trades, currentTimestamp, i);
			if (subTrades.length > 0) return this.getVolumeMedianPrice(subTrades, currentTimestamp);
		}

		return { price: 0, volume: 0, timestamp: currentTimestamp };
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

	consolidatePriceFix(exchangePriceVolume: Array<Price>): number {
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

		const priceFix: number = this.consolidatePriceFix(exchangePriceVolume);

		if (priceFix === 0) {
			console.log('no priceFix found, use the last ETH price');
			const lastPriceObj = await sqlUtil.readLastPrice();
			console.log(
				'the priceFix is: ' + lastPriceObj.price + ' at timestamp ' + lastPriceObj.timestamp
			);
			return lastPriceObj;
		} else {
			console.log('the priceFix is: ' + priceFix + ' at timestamp ' + currentTimestamp);
			console.log(exchangePriceVolume);
			console.log(exchangePriceVolume.reduce((sum, p) => sum + p.volume, 0));
			const priceObj = {
				price: priceFix,
				volume: exchangePriceVolume.reduce((sum, p) => sum + p.volume, 0),
				timestamp: currentTimestamp
			};
			// save price into DB
			await sqlUtil.insertPrice(priceObj);

			return priceObj;
		}
	}
}
const calculator = new Calculateor();
export default calculator;
