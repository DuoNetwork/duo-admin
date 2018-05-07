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

	executeQuery(sqlQuery: string): Promise<any> {
		console.log(sqlQuery);
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

		const priceStr = sourceData.price.toString();
		const amountStr = sourceData.amount.toString();

		const sql =
			'REPLACE ' +
			CST.DB_TABLE_TRADE +
			" VALUES ('" +
			sourceData.source +
			"','" +
			sourceData.id +
			"','" +
			priceStr +
			"','" +
			amountStr +
			"','" +
			(sourceData.timestamp || systemTimestamp) +
			"','" +
			systemTimestamp +
			"')";
		console.log(await this.executeQuery(sql));
		// await this.executeQuery(sql);
	}

	async insertPrice(price: Price) {
		console.log(
			await this.executeQuery(
				'INSERT INTO ' +
					CST.DB_TABLE_HISTORY +
					" VALUES ('" +
					price.timestamp +
					"','" +
					price.price +
					"','" +
					price.volume +
					"')"
			)
		);
	}

	async readLastPrice(): Promise<Price> {
		const res = await this.executeQuery(
			'SELECT * FROM ' +
				CST.DB_TABLE_HISTORY +
				' order by ' +
				CST.DB_HISTORY_TIMESTAMP +
				' DESC LIMIT 1'
		);
		return res[0]
			? {
					price: Number(res[0][CST.DB_HISTORY_PRICE]),
					timestamp: Number(res[0][CST.DB_HISTORY_TIMESTAMP]),
					volume: Number(res[0][CST.DB_HISTORY_VOLUME])
			}
			: { price: 0, timestamp: 0, volume: 0 };
	}

	async readSourceData(currentTimestamp: number): Promise<Trade[]> {
		const lowerTime = currentTimestamp - 3600000 + '';
		const upperTime = currentTimestamp + '';
		const res: object[] = await this.executeQuery(
			'SELECT * FROM ' +
				CST.DB_TABLE_TRADE +
				' WHERE ' +
				CST.DB_TX_TS +
				' >= ' +
				lowerTime +
				' AND ' +
				CST.DB_TX_TS +
				' <= ' +
				upperTime
		);
		return res.map(item => ({
			source: item[CST.DB_TX_SRC],
			id: item[CST.DB_TX_ID],
			price: Number(item[CST.DB_TX_PRICE]),
			amount: Number(item[CST.DB_TX_AMOUNT]),
			timestamp: Number(item[CST.DB_TX_TS])
		}));
	}
}

const sqlUtil = new SqlUtil();
export default sqlUtil;
