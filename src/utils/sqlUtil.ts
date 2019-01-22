import * as mysql from 'mysql';
import * as CST from '../common/constants';
import { IPriceFix, ITrade } from '../common/types';
import dynamoUtil from './dynamoUtil';
import util from './util';

class SqlUtil {
	public conn: undefined | mysql.Connection = undefined;
	public init(host: string, user: string, pwd: string) {
		this.conn = mysql.createConnection({
			host: host,
			user: user,
			password: pwd,
			database: CST.DB_SQL_SCHEMA_PRICEFEED
		});

		return new Promise<void>((resolve, reject) => {
			if (this.conn) {
				this.conn.on('error', err => {
					if (err.code === 'PROTOCOL_CONNECTION_LOST') {
						util.logInfo('ERROR: Server Disconnects. Reconnecting');
						this.init(host, user, pwd);
					} else throw err;
				});
				this.conn.connect(err => {
					if (err) reject(err);
					util.logInfo('Connected!');
					resolve();
				});
			} else reject('no connection');
		});
	}

	public executeQuery(sqlQuery: string): Promise<any> {
		return new Promise((resolve, reject) => {
			if (this.conn)
				this.conn.query(sqlQuery, (err, result) => {
					if (err && err.code !== undefined && err.code === 'ER_DUP_ENTRY') reject(err);
					else if (err) reject(err);
					else resolve(result);
				});
			else reject('sql db connection is not initialized');
		});
	}

	public getTradeCounts() {
		const sql = `SELECT COUNT(*) FROM ${CST.DB_SQL_TRADE} WHERE 1`;
		return this.executeQuery(sql);
	}

	public async insertTradeData(trade: ITrade, insertStatus: boolean) {
		const systemTimestamp = util.getUTCNowTimestamp();
		const priceStr = trade.price.toString();
		const amountStr = trade.amount.toString();

		const sql =
			'REPLACE ' +
			CST.DB_SQL_TRADE +
			" VALUES ('" +
			trade.source +
			"','" +
			trade.id +
			"','" +
			priceStr +
			"','" +
			amountStr +
			"','" +
			(trade.timestamp || systemTimestamp) +
			"','" +
			systemTimestamp +
			"','" +
			(trade.quote + '|' + trade.base) +
			"')";
		await this.executeQuery(sql);
		if (insertStatus)
			await dynamoUtil.insertStatusData(
				dynamoUtil.convertTradeToDynamo(trade, systemTimestamp)
			);
	}

	public async insertPrice(price: IPriceFix) {
		util.logInfo(
			await this.executeQuery(
				'INSERT INTO ' +
					CST.DB_SQL_HISTORY +
					" VALUES ('" +
					price.timestamp +
					"','" +
					price.price +
					"','" +
					price.volume +
					"','" +
					(price.quote + '|' + price.base) +
					"')"
			)
		);
	}

	public async readLastPrice(quote: string, base: string): Promise<IPriceFix> {
		const pair = quote + '|' + base;
		const res = await this.executeQuery(
			`SELECT * FROM ${CST.DB_SQL_HISTORY} WHERE pair='${pair}' ORDER BY ${
				CST.DB_HISTORY_TIMESTAMP
			} DESC LIMIT 1;`
		);
		return res[0]
			? {
					price: Number(res[0][CST.DB_HISTORY_PRICE]),
					timestamp: Number(res[0][CST.DB_HISTORY_TIMESTAMP]),
					volume: Number(res[0][CST.DB_HISTORY_VOLUME]),
					source: '',
					base: base,
					quote: quote
			}
			: {
					price: 0,
					timestamp: 0,
					volume: 0,
					source: '',
					base: base,
					quote: quote
			};
	}

	public async readSourceData(
		currentTimestamp: number,
		quote: string,
		base: string
	): Promise<ITrade[]> {
		const pair = quote + '|' + base;
		const lowerTime = currentTimestamp - 3600000 + '';
		const upperTime = currentTimestamp + '';
		const res: Array<{ [key: string]: string }> = await this.executeQuery(
			'SELECT * FROM ' +
				CST.DB_SQL_TRADE +
				' WHERE ' +
				CST.DB_TX_TS +
				' >= ' +
				lowerTime +
				' AND ' +
				CST.DB_TX_TS +
				' <= ' +
				upperTime +
				` AND pair = '${pair}';`
		);
		return res.map(item => ({
			quote: item[CST.DB_TX_QTE],
			base: item[CST.DB_TX_BASE],
			id: item[CST.DB_TX_ID],
			source: item[CST.DB_TX_SRC],
			price: Number(item[CST.DB_TX_PRICE]),
			amount: Number(item[CST.DB_TX_AMOUNT]),
			timestamp: Number(item[CST.DB_TX_TS])
		}));
	}

	public async cleanDB(): Promise<void> {
		const queryString =
			'DELETE FROM ' +
			CST.DB_SQL_TRADE +
			' WHERE timestamp < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY)) * 1000';
		util.logInfo(queryString);
		util.logDebug(JSON.stringify(await this.executeQuery(queryString)));
		util.logInfo(JSON.stringify(await this.getTradeCounts()));
	}
}

const sqlUtil = new SqlUtil();
export default sqlUtil;
