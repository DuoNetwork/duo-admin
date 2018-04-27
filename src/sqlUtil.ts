import * as mysql from 'mysql';
import * as CST from './constants';
// const math = require("mathjs");
import { Price, Trade } from './types';

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
			if (err) throw err;
			console.log('Connected!');
		});
	}

	executeQuery(sqlQuery: string): any {
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

	async insertSourceData(sourceData: Trade) {
		const systemTimestamp = Math.floor(Date.now()); // record down the MTS

		// let price_str = math.format(price, { exponential: { lower: 1e-100, upper: 1e100 } });
		// let amount_str = math.format(amount, { exponential: { lower: 1e-100, upper: 1e100 } });

		const priceStr = sourceData.price.split('"').join('');
		const amountStr = sourceData.amount.split('"').join('');

		const sql =
			'REPLACE ' +
			CST.DB_TABLE_TRADE +
			" VALUES ('" +
			sourceData.source +
			"','" +
			sourceData.tradeId +
			"','" +
			priceStr +
			"','" +
			amountStr +
			"','" +
			sourceData.tradeType +
			"','" +
			(sourceData.sourceTimestamp || systemTimestamp + '') +
			"','" +
			systemTimestamp +
			"')";
		// console.log(await this.executeQuery(sql));
		await this.executeQuery(sql);
	}

	async insertPrice(price: Price) {
		console.log(
			await this.executeQuery(
				'INSERT INTO eth_historical_price' +
					" VALUES ('" +
					price.timestamp +
					"','" +
					price.price +
					"')"
			)
		);
	}

	async readLastPrice(): Promise<Price> {
		const res = await this.executeQuery(
			'SELECT * FROM eth_historical_price order by timestamp DESC LIMIT 1'
		);
		return {
			price: res[0][CST.DB_HISTORY_PRICE],
			timestamp: res[0][CST.DB_HISTORY_TIMESTAMP]
		};
	}

	async readSourceData(currentTimestamp: number): Promise<Trade[]> {
		const lowerTime = currentTimestamp - 3600000 + '';
		const upperTime = currentTimestamp + '';
		const res: object[] = await this.executeQuery(
			'SELECT * FROM ' +
				CST.DB_TABLE_TRADE +
				' WHERE exchange_returned_timestamp >= ' +
				lowerTime +
				' AND exchange_returned_timestamp <= ' +
				upperTime
		);
		return res.map(item => ({
			source: item[CST.DB_TX_EXCHANGE_SRC],
			tradeId: item[CST.DB_TX_TRADE_ID],
			price: item[CST.DB_TX_PRICE],
			amount: item[CST.DB_TX_AMOUNT],
			tradeType: item[CST.DB_TX_TYPE],
			sourceTimestamp: item[CST.DB_TX_EXCHANGE_TIME_STAMP]
		}));
	}
}

const sqlUtil = new SqlUtil();
export default sqlUtil;