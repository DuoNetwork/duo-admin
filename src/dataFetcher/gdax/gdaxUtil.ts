import MysqlUtil from '../../utils/MysqlUtil';
import * as CST from '../../constant';
import request from 'request';

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
		const requestPromise = new Promise<string>((resolve, reject) =>
			request(
				{
					url: 'https://api.gdax.com:443/products/ETH-USD/trades',
					// This is the only line that is new. `headers` is an object with the headers to request
					headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10; rv:33.0) Gecko/20100101 Firefox/33.0' }
				},
				(error, res, body) => {
					if (error) reject(error);
					else if (res.statusCode === 200) resolve(body);
					else reject('Error status ' + res.statusCode + ' ' + res.statusMessage);
				}
			)
		);

		requestPromise.then(data => {
			const dbConn = coinbaseGDAXTradeFeedUtil.mysqlUtil.dbConn;
			if (dbConn == undefined) {
				coinbaseGDAXTradeFeedUtil.initDB();
			}
			const parsedData: Array<{ [key: string]: string }> = JSON.parse(data);

			parsedData.forEach(item => {
				coinbaseGDAXTradeFeedUtil.mysqlUtil.insertDataIntoMysql(
					EXCHANGE_NAME,
					item.trade_id,
					item.price,
					item.size,
					item.side,
					new Date(item.time).valueOf() + ''
				);
			});
		});
	}

	startFetching() {
		setInterval(coinbaseGDAXTradeFeedUtil.fetchETHTradesByRestfulAPI, INTERVAL_SECS * 1000);
	}
}

const coinbaseGDAXTradeFeedUtil = new CoinbaseGDAXTradeFeedUtil();
export default coinbaseGDAXTradeFeedUtil;
