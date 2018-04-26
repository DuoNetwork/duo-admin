import MysqlUtil from '../MysqlUtil';
import * as CST from '../constants';

// let dbConn;

const INTERVAL_SECS = 2;

let last = 0; // last = id to be used as since when polling for new trade data
let requestJson: object = {};

export class KrakenUtil {
	mysqlUtil: MysqlUtil;

	constructor() {
		this.mysqlUtil = new MysqlUtil(
			CST.EXCHANGE_KRAKEN,
			CST.DB_HOST,
			CST.DB_USER,
			CST.DB_PASSWORD,
			CST.DB_PRICEFEED,
			CST.DB_TABLE_TRADE
		);
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

				const dbConn = this.mysqlUtil.dbConn;

				if (dbConn == undefined) {
					this.initDB();
				}

				const returnFirstLevelArray = response.result.XETHZUSD;
				// console.log(returnFirstLevelArray);

				returnFirstLevelArray.forEach(secondLevelArr => {
					let trade_type: string = 'buy';
					const exchange_returned_timestamp =
						Math.floor(Number(secondLevelArr[2]) * 1000) + '';

					if (secondLevelArr[3] == 'b') {
						trade_type = 'buy';
					} else if (secondLevelArr[3] == 's') {
						trade_type = 'sell';
					}
					this.mysqlUtil.insertDataIntoMysql(
						CST.EXCHANGE_KRAKEN,
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
		setInterval(() => this.fetchETHTradesByOwnWebSocket(), INTERVAL_SECS * 1000);
	}
}
const krakenUtil = new KrakenUtil();
export default krakenUtil;
