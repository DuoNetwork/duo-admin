import MysqlUtil from '../../utils/MysqlUtil';
import * as CST from '../../constant';

const INTERVAL_SECS = 2;

const EXCHANGE_NAME = CST.EXCHANGE_GDAX;
const DB_HOST = CST.DB_HOST;
const DB_USER = CST.DB_USER;
const DB_PASSWORD = CST.DB_PASSWORD;
const DB_PRICEFEED = CST.DB_PRICEFEED;
const DB_TABLE_TRADE = CST.DB_TABLE_TRADE;

export class CoinbaseGDAXTradeFeedUtil {
	mysqlUtil: MysqlUtil;

	constructor() {
		this.mysqlUtil = new MysqlUtil(EXCHANGE_NAME, DB_HOST, DB_USER, DB_PASSWORD, DB_PRICEFEED, DB_TABLE_TRADE);
	}

	initDB() {
		console.log('Init the DB');
		this.mysqlUtil.initDB();
	}

	fetchETHTradesByRestfulAPI() {
		var https = require('https');

		var options = {
			host: 'api.gdax.com',
			path: '/products/ETH-USD/trades',
			port: '443',
			//This is the only line that is new. `headers` is an object with the headers to request
			headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10; rv:33.0) Gecko/20100101 Firefox/33.0' }
		};

		var callbackFunc = response => {
			var responseStr = '';
			response.on('data', chunk => {
				responseStr += chunk;
			});

			response.on('end', () => {
				var parsedJson = JSON.parse(responseStr);

				let dbConn = coinbaseGDAXTradeFeedUtil.mysqlUtil.dbConn;
				if (dbConn == undefined) {
					coinbaseGDAXTradeFeedUtil.initDB();
				}

				parsedJson.forEach(item => {
					coinbaseGDAXTradeFeedUtil.mysqlUtil.insertDataIntoMysql(EXCHANGE_NAME, item.trade_id, item.price, item.size, item.side, new Date(item.time).valueOf() +"");
				});
			});
		};

		var req = https.request(options, callbackFunc);
		req.end();
	}

	startFetching() {
		setInterval(coinbaseGDAXTradeFeedUtil.fetchETHTradesByRestfulAPI, INTERVAL_SECS * 1000);
	}
}

const coinbaseGDAXTradeFeedUtil = new CoinbaseGDAXTradeFeedUtil();
export default coinbaseGDAXTradeFeedUtil;
