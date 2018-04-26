import * as mysql from 'mysql';
import * as CST from './constants';
// const math = require("mathjs");

export class SqlUtil {
	conn: undefined | mysql.Connection = undefined;

	init(user: string, pwd: string) {
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

	executeQuery(sqlQuery) {
		return new Promise((resolve, reject) => {
			if (this.conn)
				this.conn.query(sqlQuery, (err, result) => {
					if (err && err.code != undefined && err.code === 'ER_DUP_ENTRY')
						// console.log('.');
						// rocess.stdout.write(".");
						reject(err);
					else if (err) reject(err);
					else resolve(result);
				});
			else reject('db connection is not initialized');
		});
	}

	async insertSourceData(
		exchangeSoucre: string,
		tradeId: string,
		price: string,
		amount: string,
		tradeType: string,
		exchangeReturnedTimestamp: string
	) {
		const systemTimestamp = Math.floor(Date.now()); // record down the MTS
		if (!exchangeReturnedTimestamp) {
			exchangeReturnedTimestamp = systemTimestamp + '';
		}

		// let price_str = math.format(price, { exponential: { lower: 1e-100, upper: 1e100 } });
		// let amount_str = math.format(amount, { exponential: { lower: 1e-100, upper: 1e100 } });

		const priceStr = price.split('"').join('');
		const amountStr = amount.split('"').join('');

		const sql =
			'REPLACE ' +
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

		console.log(await this.executeQuery(sql));
	}

	async insertPrice(timestamp: string, price: string) {
		console.log(
			await this.executeQuery(
				'INSERT INTO ' +
					'eth_historical_price' +
					" VALUES ('" +
					timestamp +
					"','" +
					price +
					"')"
			)
		);
	}

	readLastPrice() {
		return this.executeQuery(
			'SELECT * FROM `eth_historical_price` order by timestamp DESC LIMIT 1'
		);
	}

	readSourceData(currentTimestamp: number): Promise<any> {
		const lowerTime = currentTimestamp - 3600000 + '';
		const upperTime = currentTimestamp + '';
		return this.executeQuery(
			'SELECT * FROM ' +
				CST.DB_TABLE_TRADE +
				' WHERE exchange_returned_timestamp >= ' +
				lowerTime +
				' AND exchange_returned_timestamp <= ' +
				upperTime
		);
	}
}

const sqlUtil = new SqlUtil();
export default sqlUtil;
