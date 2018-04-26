import * as mysql from 'mysql';
import * as CST from './constants';
// const math = require("mathjs");

export class SqlUtil {
	conn: undefined | mysql.Connection = undefined;

	initDB(user: string, pwd: string) {
		this.conn = mysql.createConnection({
			host: CST.DB_HOST,
			user: user,
			password: pwd,
			database: CST.DB_PRICEFEED
		});

		this.conn.connect(function(err) {
			if (err) {
				console.log('err' + err);
				// throw err;
			}
			console.log('Connected!');
			// dbConn.close();
		});
	}

	checkConn() {
		if (this.conn === undefined) {
			throw new Error('db connection is not initialized');
		}
	}

	insertDataIntoMysql(
		exchangeSoucre: string,
		tradeId: string,
		price: string,
		amount: string,
		tradeType: string,
		exchangeReturnedTimestamp: string
	) {
		this.checkConn();

		const systemTimestamp = Math.floor(Date.now()); // record down the MTS
		if (!exchangeReturnedTimestamp) {
			exchangeReturnedTimestamp = systemTimestamp + '';
		}

		// let price_str = math.format(price, { exponential: { lower: 1e-100, upper: 1e100 } });
		// let amount_str = math.format(amount, { exponential: { lower: 1e-100, upper: 1e100 } });

		const priceStr = price.split('"').join('');
		const amountStr = amount.split('"').join('');

		const sql =
			'INSERT INTO ' +
			CST.DB_TABLE_TRADE +
			" VALUES ('" +
			exchangeSoucre +
			"','" +
			tradeId +
			"','" +
			priceStr +
			"','" +
			amountStr +
			"','" +
			tradeType +
			"','" +
			exchangeReturnedTimestamp +
			"','" +
			systemTimestamp +
			"')";

		console.log(sql);
		this.conn && this.conn.query(sql, function(err: any, result: any) {
			// if (err) throw err;
			if (err && err.code != undefined && err.code === 'ER_DUP_ENTRY') {
				// console.log('.');
				// rocess.stdout.write(".");
			} else if (err) {
				console.log('err' + err);
			} else {
				console.log(result);
			}
		});
	}

	insertETHpriceMysql(timestamp: string, price: string) {
		this.checkConn();

		const sql =
			'INSERT INTO ' +
			'eth_historical_price' +
			" VALUES ('" +
			timestamp +
			"','" +
			price +
			"')";

		console.log(sql);
		this.conn && this.conn.query(sql, function(err: any, result: any) {
			// if (err) throw err;
			if (err && err.code != undefined && err.code === 'ER_DUP_ENTRY') {
				// console.log('.');
				// rocess.stdout.write(".");
			} else if (err) {
				console.log('err' + err);
			} else {
				console.log(result);
			}
		});
	}

	readLastETHpriceMysql(): Promise<any> {
		this.checkConn();

		const sql = 'SELECT * FROM `eth_historical_price` order by timestamp DESC LIMIT 1';

		console.log(sql);
		return new Promise((resolve, reject) => {
			this.conn && this.conn.query(sql, function(err: any, result: any) {
				// if (err) throw err;
				if (err && err.code != undefined && err.code === 'ER_DUP_ENTRY') {
					// console.log('.');
					// rocess.stdout.write(".");
					reject(err);
				} else if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	}

	readDataMysql(currentTimestamp: number): Promise<any> {
		this.checkConn();

		const lowerTime = currentTimestamp - 3600000 + '';
		const upperTime = currentTimestamp + '';
		// const sql = "SELECT * FROM " + this.db_table_name + " WHERE exchange_returned_timestamp >= UNIX_TIMESTAMP(NOW()) - 3600";
		const sql =
			'SELECT * FROM ' +
			CST.DB_TABLE_TRADE +
			' WHERE exchange_returned_timestamp >= ' +
			lowerTime +
			' AND exchange_returned_timestamp <= ' +
			upperTime;

		console.log(sql);
		return new Promise((resolve, reject) => {
			this.conn && this.conn.query(sql, function(err: any, result: any) {
				// if (err) throw err;
				if (err && err.code != undefined && err.code === 'ER_DUP_ENTRY') {
					// console.log('.');
					// rocess.stdout.write(".");
					reject(err);
				} else if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	}
}

const sqlUtil = new SqlUtil();
export default sqlUtil;
