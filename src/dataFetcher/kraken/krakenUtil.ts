import MysqlUtil from '../../utils/MysqlUtil';
import * as CST from '../../constant';

// let dbConn;

const INTERVAL_SECS = 2;

const EXCHANGE_NAME = CST.EXCHANGE_KRAKEN;
const DB_HOST = CST.DB_HOST;
const DB_USER = CST.DB_USER;
const DB_PASSWORD = CST.DB_PASSWORD;
const DB_PRICEFEED = CST.DB_PRICEFEED;
const DB_TABLE_TRADE = CST.DB_TABLE_TRADE;

let last = 0; // last = id to be used as since when polling for new trade data
let requestJson: object = {};

export class KrankenTradeFeedUtil {
	mysqlUtil: MysqlUtil;

	constructor() {
		this.mysqlUtil = new MysqlUtil(EXCHANGE_NAME, DB_HOST, DB_USER, DB_PASSWORD, DB_PRICEFEED, DB_TABLE_TRADE);
	}

	initDB() {
		console.log('Init the DB');

		this.mysqlUtil.initDB();
	}

	fetchETHTradesByOwnWebSocket() {
		const Kraken = require('kraken-wrapper');

		const kraken = new Kraken();

		if (last == 0) {
			requestJson = { pair: 'ETHUSD' };
		} else if (last != undefined) {
			requestJson = { pair: 'ETHUSD', last: last };
		}
		console.log('request: ' + last + 'length: ' + last.toString().split('.')[0].length);

		kraken
			.getTrades(requestJson)
			.then(response => {
				// var jsonObj= JSON.parse(response);

				const dbConn = krankenTradeFeedUtil.mysqlUtil.dbConn;

				if (dbConn == undefined) {
					krankenTradeFeedUtil.initDB();
				}

				const returnFirstLevelArray = response.result.XETHZUSD;

				returnFirstLevelArray.forEach(secondLevelArr => {
					let trade_type: string = 'buy';
					const exchange_returned_timestamp = Math.floor(Number(secondLevelArr[2]) * 1000) + '';

					if (secondLevelArr[3] == 'b') {
						trade_type = 'buy';
					} else if (secondLevelArr[3] == 's') {
						trade_type = 'sell';
					}
					krankenTradeFeedUtil.mysqlUtil.insertDataIntoMysql(
						EXCHANGE_NAME,
						'',
						secondLevelArr[0],
						secondLevelArr[1],
						trade_type,
						exchange_returned_timestamp
					);
				});

				last = response.result.last;
				console.log(last);
			})
			.catch(error => {
				console.log(error);
			});
	}

	startFetching() {
		setInterval(krankenTradeFeedUtil.fetchETHTradesByOwnWebSocket, INTERVAL_SECS * 1000);
	}
}
const krankenTradeFeedUtil = new KrankenTradeFeedUtil();
export default krankenTradeFeedUtil;
