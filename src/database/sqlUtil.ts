import * as mysql from 'mysql';
import * as CST from '../constants';
import { IPrice, ITrade } from '../types';
import util from '../util';

export class SqlUtil {
	public conn: undefined | mysql.Connection = undefined;

	public init(user: string, pwd: string) {
		this.conn = mysql.createConnection({
			host: CST.DB_HOST,
			user,
			password: pwd,
			database: CST.DB_PRICEFEED
		});

		this.conn.connect(err => {
			if (err) throw err;
			util.log('Connected!');
		});
	}

	public executeQuery(sqlQuery: string): Promise<any> {
		// util.log(sqlQuery);
		return new Promise((resolve, reject) => {
			if (this.conn)
				this.conn.query(sqlQuery, (err, result) => {
					if (err && err.code !== undefined && err.code === 'ER_DUP_ENTRY')
						// util.log('.');
						// rocess.stdout.write(".");
						reject(err);
					else if (err) reject(err);
					else resolve(result);
				});
			else reject('db connection is not initialized');
		});
	}

	public async insertSourceData(live: boolean, sourceData: ITrade) {
		const systemTimestamp = Math.floor(Date.now()); // record down the MTS

		// To do the checking for out of boundary data.
		// if(isNaN(sourceData.price)){
		// 	util.log('Price is NaN!');
		// 	return;
		// }

		// if(isNaN(sourceData.amount)){
		// 	util.log('Amount is NaN!');
		// 	return;
		// }

		// let price_str = math.format(price, { exponential: { lower: 1e-100, upper: 1e100 } });
		// let amount_str = math.format(amount, { exponential: { lower: 1e-100, upper: 1e100 } });

		const priceStr = sourceData.price.toString();
		const amountStr = sourceData.amount.toString();

		const TABLE = live ? CST.DB_TABLE_TRADE : CST.DB_TABLE_TRADE_DEV;
		const sql =
			'REPLACE ' +
			TABLE +
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
		// util.log(await this.executeQuery(sql));
		await this.executeQuery(sql);
	}

	public async insertPrice(price: IPrice) {
		util.log(
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

	public async readLastPrice(): Promise<IPrice> {
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

	public async readSourceData(currentTimestamp: number): Promise<ITrade[]> {
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
