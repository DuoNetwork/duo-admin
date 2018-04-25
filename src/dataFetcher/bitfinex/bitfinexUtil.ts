import MysqlUtil from '../../utils/MysqlUtil';
import * as CST from '../../constant';

const EXCHANGE_NAME = CST.EXCHANGE_BITFINEX;
const DB_HOST = CST.DB_HOST;
const DB_USER = CST.DB_USER;
const DB_PASSWORD = CST.DB_PASSWORD;
const DB_PRICEFEED = CST.DB_PRICEFEED;
const DB_TABLE_TRADE = CST.DB_TABLE_TRADE;

export class BitfinexTradeFeedUtil {
	mysqlUtil: MysqlUtil;

	constructor() {
		this.mysqlUtil = new MysqlUtil(EXCHANGE_NAME, DB_HOST, DB_USER, DB_PASSWORD, DB_PRICEFEED, DB_TABLE_TRADE);
	}

	initDB() {
		console.log('Init the DB');
		this.mysqlUtil.initDB();
	}

	// Version 2 WebSocket API ---
	fetchETHTradesByOwnWebSocket() {
		const ws = require('ws');
		const w = new ws('wss://api.bitfinex.com/ws/2');

		w.on('message', msg => {
			const dbConn = this.mysqlUtil.dbConn;
			if (dbConn === undefined) {
				this.initDB();
			}

			let parsedJson = JSON.parse(msg);
			if (parsedJson != undefined) {
				// handle the snopshot
				if (parsedJson.event === undefined && parsedJson[1] != 'hb' && !(parsedJson[1] == 'te' || parsedJson[1] == 'tu')) {
					// console.log(parsedJson);
					const snopshotArr = parsedJson[1];
					snopshotArr.forEach(element => {
						// console.log("===>"+element);
						const amount: number = parseFloat(element[2]);
						let trade_type: string = 'buy';
						if (amount > 0) {
							trade_type = 'buy';
						} else {
							trade_type = 'sell';
						}
						// console.log("=>"+trade_type);
						this.mysqlUtil.insertDataIntoMysql(EXCHANGE_NAME, element[0], element[3] + '', Math.abs(amount) + '', trade_type, element[1]);
					});
				} else if (parsedJson[1] != 'hb' && parsedJson[1] == 'te') {
					// console.log("<==="+parsedJson);
					parsedJson = parsedJson[2];
					const amount: number = parseFloat(parsedJson[2]);
					let trade_type: string = 'buy';
					if (amount > 0) {
						trade_type = 'buy';
					} else {
						trade_type = 'sell';
					}
					// console.log("=>"+trade_type);
					this.mysqlUtil.insertDataIntoMysql(EXCHANGE_NAME, parsedJson[0], parsedJson[3] + '', Math.abs(amount) + '', trade_type, parsedJson[1]);
				}
			}
		});

		const msg = JSON.stringify({
			event: 'subscribe',
			channel: 'trades',
			symbol: 'ETHUSD'
		});

		w.on('open', () => {
			console.log('[Bitfinex]-WebSocket is open');
			w.send(msg);
			console.log('subscribe trade');
		});

		w.on('close', () => {
			console.log('[Bitfinex]-WebSocket is close now');
			console.log('close DB');
		});
	}
}
const bitfinexTradeFeedUtil = new BitfinexTradeFeedUtil();
export default bitfinexTradeFeedUtil;
