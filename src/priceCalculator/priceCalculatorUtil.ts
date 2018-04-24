import MysqlUtil from '../utils/MysqlUtil';
import * as CST from '../constant';

const DB_HOST = CST.DB_HOST;
const DB_USER = CST.DB_USER;
const DB_PASSWORD = CST.DB_PASSWORD;
const DB_PRICEFEED = CST.DB_PRICEFEED;
const DB_TABLE_TRADE = CST.DB_TABLE_TRADE;

export class CalculatePrice {
	mysqlUtil: MysqlUtil;

	omittedBITFINEX: boolean = false;
	// let omittedGEMINI: boolean = false;
	// let omittedGDAX: boolean = false;
	// let omittedKRAKEN: boolean = false;

	constructor() {
		console.log('begin');
		this.mysqlUtil = new MysqlUtil('', DB_HOST, DB_USER, DB_PASSWORD, DB_PRICEFEED, DB_TABLE_TRADE);
	}

	initDB() {
		console.log('Init the DB');
		this.mysqlUtil.initDB();
	}

	getFiveMinutesIntervalTrades(trades: any[], current_timestamp: number, interval: number): object[] {
		let subTrades: object[] = [];
		const oneInterval = 5 * 60 * 1000;
		let upperTime: number = current_timestamp - interval * oneInterval;
		let lowerTime: number = upperTime - oneInterval;

		trades.forEach(item => {
			if (item.exchange_returned_timestamp <= upperTime && item.exchange_returned_timestamp > lowerTime) {
				subTrades.push(item);
			}
		});
		return subTrades;
	}

	getVolumeMedianPrice(subTrades: any[]): number {
		subTrades.sort(function(a, b) {
			return a.price - b.price;
		});
		
		let priceList: number[] = [];
		let volumeList: number[] = [];

		for(let i = 0; i < subTrades.length; i++) {
			priceList.push(Number(subTrades[i].price));
			volumeList.push(Number(subTrades[i].amount));
		}
		// console.log(priceList);

		let volumeSum: number = volumeList.reduce((a, b) => a + b, 0 );
		console.log(volumeSum);

	

		return subTrades[0].price;
	}

	getExchangePriceFix(trades: any[], current_timestamp: number): number {
		let i = 0;
		let subTrades;
		let fixFound: boolean = false;
		let fixPrice: number = 0;
		while (!fixFound && !this.omittedBITFINEX && i <= 12) {
			if (i === 12) {
				this.omittedBITFINEX = true;
			} else {
				subTrades = this.getFiveMinutesIntervalTrades(trades, current_timestamp, i);

				if (subTrades.length > 0) {
					fixFound = true;
					fixPrice = this.getVolumeMedianPrice(subTrades);
				}
				i += 1;
			}
		}
		return fixPrice;
	}

	calculatePrice() {
		const dbConn = this.mysqlUtil.dbConn;
		if (dbConn == undefined) {
			this.initDB();
		}

		// no timestamp returned by exchange so we leave empty there.
		const current_timestamp = Math.floor(Date.now());
		this.mysqlUtil.readDataMysql(current_timestamp).then(res => {
			let BITFINEX_trades: any[] = [],
				GEMINI_trades: any[] = [],
				GDAX_trades: any[] = [],
				KRAKEN_trades: any[] = [];

			res.forEach(item => {
				if (item.exchange_source === 'BITFINEX') BITFINEX_trades.push(item);
				else if (item.exchange_source === 'GEMINI') GEMINI_trades.push(item);
				else if (item.exchange_source === 'GDAX') GDAX_trades.push(item);
				else if (item.exchange_source === 'KRAKEN') KRAKEN_trades.push(item);
			});

			// console.log(KRAKEN_trades.length);
			// console.log(GEMINI_trades.length);
			// console.log(GDAX_trades.length);
			// console.log(BITFINEX_trades.length);
			// console.log(KRAKEN_trades);

			let BITFINEX_FIX = this.getExchangePriceFix(BITFINEX_trades, current_timestamp);
			console.log(BITFINEX_FIX);
		});
	}
}
const calculatePrice = new CalculatePrice();
export default calculatePrice;
