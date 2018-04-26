import MysqlUtil from '../MysqlUtil';
import * as CST from '../constants';
import ws from 'ws';

export class GeminiUtil {
	mysqlUtil: MysqlUtil;

	constructor() {
		this.mysqlUtil = new MysqlUtil(
			CST.EXCHANGE_GEMINI,
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
		const w = new ws('wss://api.gemini.com/v1/marketdata/ETHUSD');

		w.on('message', msg => {
			const parsedJson: any = JSON.parse(msg.toString());

			if (parsedJson.events[0].type == 'trade') {
				let timestampms = parsedJson.timestampms;

				// console.log(parsedJson.events[0]);

				const item = parsedJson.events[0];

				const dbConn = this.mysqlUtil.dbConn;
				if (dbConn == undefined) {
					this.initDB();
				}

				let trade_type = 'buy';

				if (item.makerSide == 'ask') {
					trade_type = 'buy';
				} else if (item.makerSide == 'bid') {
					trade_type = 'sell';
				}

				if (timestampms == undefined) {
					timestampms = '';
				}

				// no timestamp returned by exchange so we leave empty there.
				this.mysqlUtil.insertDataIntoMysql(
					CST.EXCHANGE_GEMINI,
					item.tid,
					item.price,
					item.amount,
					trade_type,
					timestampms
				);
			}
		});

		w.on('open', () => {
			console.log('[Gemini]-WebSocket is open');
		});
	}
}

const geminiUtil = new GeminiUtil();
export default geminiUtil;