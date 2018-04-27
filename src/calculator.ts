import sqlUtil from './sqlUtil';
import * as CST from './constants';
import { Price, Trade } from './types';

export class Calculateor {
	omitted: object = {
		BITFINEX: false,
		GEMINI: false,
		GDAX: false,
		KRAKEN: false
	};

	getFiveMinutesIntervalTrades(
		trades: Trade[],
		current_timestamp: number,
		interval: number
	): Trade[] {
		const subTrades: Trade[] = [];
		const oneInterval = 5 * 60 * 1000;
		const upperTime: number = current_timestamp - interval * oneInterval;
		const lowerTime: number = upperTime - oneInterval;

		trades.forEach((item) => {
			if (
				Number(item.sourceTimestamp) <= upperTime &&
				Number(item.sourceTimestamp) > lowerTime
			) {
				subTrades.push(item);
			}
		});
		return subTrades;
	}

	getVolumeMedianPrice(subTrades: Trade[]): number[] {
		subTrades.sort(function(a, b) {
			return Number(a.price) - Number(b.price);
		});

		const priceList: number[] = [];
		const volumeList: number[] = [];

		for (let i = 0; i < subTrades.length; i++) {
			priceList.push(Number(subTrades[i].price));
			volumeList.push(Number(subTrades[i].amount));
		}
		// let testList: number[] = [1,2,3,4];
		const halfVolumeSum: number = volumeList.reduce((a, b) => a + b) / 2;
		// console.log(halfVolumeSum);

		let volumeSum: number = 0;
		let i: number = 0;
		let medianFound: boolean = false;
		let medianFixVolume: number[] = [0, 0];
		while (!medianFound) {
			volumeSum += volumeList[i];
			if (volumeSum >= halfVolumeSum) {
				medianFound = true;
				medianFixVolume = [priceList[i], halfVolumeSum];
			}
			i += 1;
		}
		return medianFixVolume;
	}

	getExchangePriceFix(trades: Trade[], current_timestamp: number, exchange: string): number[] {
		// console.log(trades);
		let i = 0;
		let subTrades;
		let fixFound: boolean = false;
		let fixPrice: number = 0;
		let fixVolume: number = 0;
		while (!fixFound && !this.omitted[exchange] && i <= 12) {
			if (i === 12) {
				this.omitted[exchange] = true;
			} else {
				subTrades = this.getFiveMinutesIntervalTrades(trades, current_timestamp, i);

				if (subTrades.length > 0) {
					fixFound = true;
					[fixPrice, fixVolume] = this.getVolumeMedianPrice(subTrades);
				}
				i += 1;
			}
		}
		return [fixPrice, fixVolume];
	}

	getValidExchanges(): string[] {
		const validExchanges: string[] = [];
		Object.keys(this.omitted).forEach(key => {
			if (!this.omitted[key]) validExchanges.push(key);
		});
		return validExchanges;
	}

	normalizeWeightage(rawVolume: number[]): number[] {
		const sumOfVolume: number = rawVolume.reduce((a, b) => a + b);
		const weightageArray: number[] = [];
		for (let i = 0; i < rawVolume.length; i++) {
			weightageArray.push(rawVolume[i] / sumOfVolume);
		}
		return weightageArray;
	}

	checkWeightageValidation(weightageArray: number[]): boolean {
		let isValid: boolean = true;
		const numOfValidExchanges = weightageArray.length;
		for (let i = 0; i < weightageArray.length; i++) {
			if (weightageArray[i] > CST.EXCHANGE_WEIGHTAGE_TH[numOfValidExchanges][i]) {
				isValid = false;
			}
		}
		return isValid;
	}

	modifyWeightage(weightageArray: number[]): number[] {
		const numOfValidExchanges = weightageArray.length;
		let isValid: boolean = this.checkWeightageValidation(weightageArray);
		while (!isValid) {
			let sumOfCapped: number = 0;
			let sumOfUnCapped: number = 0;
			for (let i = 0; i < weightageArray.length; i++) {
				if (weightageArray[i] >= CST.EXCHANGE_WEIGHTAGE_TH[numOfValidExchanges][i]) {
					weightageArray[i] = CST.EXCHANGE_WEIGHTAGE_TH[numOfValidExchanges][i];
					sumOfCapped += CST.EXCHANGE_WEIGHTAGE_TH[numOfValidExchanges][i];
				} else {
					sumOfUnCapped += weightageArray[i];
				}
			}

			for (let i = 0; i < weightageArray.length; i++) {
				if (weightageArray[i] < CST.EXCHANGE_WEIGHTAGE_TH[numOfValidExchanges][i]) {
					weightageArray[i] = weightageArray[i] / sumOfUnCapped * (1 - sumOfCapped);
				}
			}
			// console.log(weightageArray);
			isValid = this.checkWeightageValidation(weightageArray);
		}
		return weightageArray;
	}

	consolidatePriceFix(
		exchangePriceVolume: Array<{ name: string; price: number; volume: number }>
	): number {
		// console.log(exchangePriceVolume);
		const validExchanges: string[] = this.getValidExchanges();
		const numOfValidExchanges = validExchanges.length;

		const filterredExchanges = exchangePriceVolume.filter(
			item => validExchanges.indexOf(item['name']) > -1
		);

		// sort based on volume from large to small
		filterredExchanges.sort(function(a, b) {
			return b.volume - a.volume;
		});
		const priceList: number[] = [];
		const volumeList: number[] = [];
		for (let i = 0; i < filterredExchanges.length; i++) {
			priceList.push(filterredExchanges[i]['price']);
			volumeList.push(filterredExchanges[i]['volume']);
		}

		let priceFeed: number = 0;
		if (numOfValidExchanges === 0) {
			// use previous priceFix
			priceFeed = 0;
		} else if (numOfValidExchanges === 1) {
			// let finalArray: number[] = [];
			priceFeed = priceList[0];
		} else {
			console.log('there are ' + numOfValidExchanges + ' valid exchanges');
			const weightageArray: number[] = this.normalizeWeightage(volumeList);
			const finalWeightage: number[] = this.modifyWeightage(weightageArray);
			for (let i = 0; i < finalWeightage.length; i++) {
				priceFeed += priceList[i] * finalWeightage[i];
			}
		}
		return priceFeed;
	}

	async calculatePrice(): Promise<Price> {
		const current_timestamp: number = Math.floor(Date.now());
		const trades = await sqlUtil.readSourceData(current_timestamp);
		// console.log(trades);
		// return sqlUtil.readSourceData(current_timestamp).then(trades => {
		let EXCHANGES_TRADES: {[key: string]: Trade[]};

		EXCHANGES_TRADES = {
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

		const exchangePriceVolume: Array<{ name: string; price: number; volume: number }> = [];

		for (let i = 0; i < CST.EXCHANGES.length; i++) {
			const exchangeName: string = CST.EXCHANGES[i];
			const [exchangePrice, exchangeVolume] = this.getExchangePriceFix(
				EXCHANGES_TRADES[exchangeName],
				current_timestamp,
				exchangeName
			);
			exchangePriceVolume.push({
				name: exchangeName,
				price: exchangePrice,
				volume: exchangeVolume
			});
		}
		// console.log(EXCHANGES_TRADES[CST.EXCHANGE_BITFINEX]);

		// return new Promise(resolve => {
		const priceObj: Price = {
			price: '0',
			timestamp: '0'
		};
		const priceFix: number = this.consolidatePriceFix(exchangePriceVolume);

		if (priceFix === 0) {
			console.log('no priceFix found, use the last ETH price');
			sqlUtil.readLastPrice().then(lastPriceObj => {
				// resolve([priceObj.price, current_timestamp]);
				priceObj.price = lastPriceObj.price;
				priceObj.timestamp = lastPriceObj.timestamp;
				console.log(
					'the priceFix is: ' + priceObj.price + ' at timestamp ' + priceObj.timestamp
				);
			});
		} else {
			console.log(
				'the priceFix is: ' + priceFix + ' at timestamp ' + current_timestamp
			);
			// save price into DB
			sqlUtil.insertPrice( {
				price: priceFix + '',
				timestamp: current_timestamp + ''
			});

			priceObj.price = priceFix + '';
			priceObj.timestamp = current_timestamp + '';
			// return priceObj;
		}
		return priceObj;

	}
}
const calculateor = new Calculateor();
export default calculateor;
