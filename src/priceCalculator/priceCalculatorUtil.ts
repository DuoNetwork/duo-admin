import MysqlUtil from '../utils/MysqlUtil';
import * as CST from '../constant';

const DB_HOST = CST.DB_HOST;
const DB_USER = CST.DB_USER;
const DB_PASSWORD = CST.DB_PASSWORD;
const DB_PRICEFEED = CST.DB_PRICEFEED;
const DB_TABLE_TRADE = CST.DB_TABLE_TRADE;
const EXCHANGES = CST.EXCHANGES;
const EXCHANGE_WEIGHTAGE_TH = CST.EXCHANGE_WEIGHTAGE_TH;

export class CalculatePrice {
	mysqlUtil: MysqlUtil;

	omitted: object = {
		BITFINEX: false,
		GEMINI: false,
		GDAX: false,
		KRAKEN: false
	};

	constructor() {
		// console.log('begin');
		this.mysqlUtil = new MysqlUtil('', DB_HOST, DB_USER, DB_PASSWORD, DB_PRICEFEED, DB_TABLE_TRADE);
	}

	initDB() {
		// console.log('Init the DB');
		this.mysqlUtil.initDB();
	}

	getFiveMinutesIntervalTrades(trades: any[], current_timestamp: number, interval: number): object[] {
		const subTrades: object[] = [];
		const oneInterval = 5 * 60 * 1000;
		const upperTime: number = current_timestamp - interval * oneInterval;
		const lowerTime: number = upperTime - oneInterval;

		trades.forEach(item => {
			if (item.exchange_returned_timestamp <= upperTime && item.exchange_returned_timestamp > lowerTime) {
				subTrades.push(item);
			}
		});
		return subTrades;
	}

	getVolumeMedianPrice(subTrades: any[]): number[] {
		subTrades.sort(function(a, b) {
			return a.price - b.price;
		});

		const priceList: number[] = [];
		const volumeList: number[] = [];

		for (let i = 0; i < subTrades.length; i++) {
			priceList.push(Number(subTrades[i].price));
			volumeList.push(Number(subTrades[i].amount));
		}
		// console.log(priceList);
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

	getExchangePriceFix(trades: any[], current_timestamp: number, exchange: string): number[] {
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
			if (weightageArray[i] > EXCHANGE_WEIGHTAGE_TH[numOfValidExchanges][i]) {
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
				if (weightageArray[i] >= EXCHANGE_WEIGHTAGE_TH[numOfValidExchanges][i]) {
					weightageArray[i] = EXCHANGE_WEIGHTAGE_TH[numOfValidExchanges][i];
					sumOfCapped += EXCHANGE_WEIGHTAGE_TH[numOfValidExchanges][i];
				} else {
					sumOfUnCapped += weightageArray[i];
				}
			}

			for (let i = 0; i < weightageArray.length; i++) {
				if (weightageArray[i] < EXCHANGE_WEIGHTAGE_TH[numOfValidExchanges][i]) {
					weightageArray[i] = weightageArray[i] / sumOfUnCapped * (1 - sumOfCapped);
				}
			}
			// console.log(weightageArray);
			isValid = this.checkWeightageValidation(weightageArray);
		}
		return weightageArray;
	}

	consolidatePriceFix(exchangePriceVolume: Array<{ name: string; price: number; volume: number }>): number {
		// console.log(exchangePriceVolume);
		const validExchanges: string[] = this.getValidExchanges();
		const numOfValidExchanges = validExchanges.length;

		const filterredExchanges = exchangePriceVolume.filter(item => validExchanges.indexOf(item['name']) > -1);

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

	calculatePrice(): Promise<any> {
		const dbConn = this.mysqlUtil.dbConn;
		if (dbConn == undefined) {
			this.initDB();
		}

		const current_timestamp: number = Math.floor(Date.now());
		return this.mysqlUtil.readDataMysql(current_timestamp).then(res => {
			let EXCHANGES_TRADES: object;

			EXCHANGES_TRADES = {
				[CST.EXCHANGE_BITFINEX]: [],
				[CST.EXCHANGE_GEMINI]: [],
				[CST.EXCHANGE_GDAX]: [],
				[CST.EXCHANGE_KRAKEN]: []
			};

			res.forEach(item => {
				if (item.exchange_source === CST.EXCHANGE_BITFINEX) EXCHANGES_TRADES[CST.EXCHANGE_BITFINEX].push(item);
				else if (item.exchange_source === CST.EXCHANGE_GEMINI) EXCHANGES_TRADES[CST.EXCHANGE_GEMINI].push(item);
				else if (item.exchange_source === CST.EXCHANGE_GDAX) EXCHANGES_TRADES[CST.EXCHANGE_GDAX].push(item);
				else if (item.exchange_source === CST.EXCHANGE_KRAKEN) EXCHANGES_TRADES[CST.EXCHANGE_KRAKEN].push(item);
			});

			const exchangePriceVolume: Array<{ name: string; price: number; volume: number }> = [];

			for (let i = 0; i < EXCHANGES.length; i++) {
				const exchangeName: string = EXCHANGES[i];
				const [exchangePrice, exchangeVolume] = this.getExchangePriceFix(EXCHANGES_TRADES[exchangeName], current_timestamp, exchangeName);
				exchangePriceVolume.push({
					name: exchangeName,
					price: exchangePrice,
					volume: exchangeVolume
				});
			}

			return new Promise((resolve) => {
				const priceFix: number = this.consolidatePriceFix(exchangePriceVolume);

				if (priceFix === 0) {
					console.log('no priceFix found, use the last ETH price');
					this.mysqlUtil.readLastETHpriceMysql().then(res => {
						const lastPrice: number = res[0]['price'];
						console.log('the priceFix is: ' + lastPrice + ' at timestamp ' + current_timestamp);
						// price["price"] = lastPrice;
						// price["time"] = current_timestamp;
						resolve([lastPrice, current_timestamp]);
					});
				} else {
					console.log('the priceFix is: ' + priceFix + ' at timestamp ' + current_timestamp);
					// save price into DB
					this.mysqlUtil.insertETHpriceMysql(current_timestamp + '', priceFix + '');
					resolve([priceFix, current_timestamp]);
				}

			});

		});
	}
}
const calculatePrice = new CalculatePrice();
export default calculatePrice;
