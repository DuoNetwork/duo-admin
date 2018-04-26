import MysqlUtil from '../MysqlUtil';
import * as CST from '../constants';
import request from 'request';

const INTERVAL_SECS = 2;

export class GdaxUtil {
	mysqlUtil: MysqlUtil;

	constructor() {
		this.mysqlUtil = new MysqlUtil(
			CST.EXCHANGE_GDAX,
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

	fetchETHTradesByRestfulAPI() {
		const requestPromise = new Promise<string>((resolve, reject) =>
			request(
				{
					url: 'https://api.gdax.com:443/products/ETH-USD/trades',
					// This is the only line that is new. `headers` is an object with the headers to request
					headers: {
						'User-Agent': 'nodejs'
					}
				},
				(error, res, body) => {
					if (error) reject(error);
					else if (res.statusCode === 200) resolve(body);
					else reject('Error status ' + res.statusCode + ' ' + res.statusMessage);
				}
			)
		);

		requestPromise.then(data => {
			const dbConn = this.mysqlUtil.dbConn;
			if (dbConn == undefined) {
				this.initDB();
			}
			const parsedData: Array<{ [key: string]: string }> = JSON.parse(data);

			parsedData.forEach(item => {
				this.mysqlUtil.insertDataIntoMysql(
					CST.EXCHANGE_GDAX,
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
		setInterval(() => this.fetchETHTradesByRestfulAPI(), INTERVAL_SECS * 1000);
	}
}

const gdaxUtil = new GdaxUtil();
export default gdaxUtil;
