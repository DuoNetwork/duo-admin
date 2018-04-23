import MysqlUtil from '../../utils/MysqlUtil';
import * as CST from '../../constant';

const EXCHANGE_NAME = CST.EXCHANGE_GEMINI;
const DB_HOST = CST.DB_HOST;
const DB_USER = CST.DB_USER;
const DB_PASSWORD = CST.DB_PASSWORD;
const DB_PRICEFEED = CST.DB_PRICEFEED;
const DB_TABLE_TRADE = CST.DB_TABLE_TRADE;

export class GeminiTradeFeedUtil {
	mysqlUtil: MysqlUtil;

	constructor() {
		console.log('begin');
		this.mysqlUtil = new MysqlUtil(EXCHANGE_NAME, DB_HOST, DB_USER, DB_PASSWORD, DB_PRICEFEED, DB_TABLE_TRADE);
	}

	initDB() {
		console.log('Init the DB');
		this.mysqlUtil.initDB();
	}

	fetchETHTradesByOwnWebSocket() {
		const ws = require('ws');
		const w = new ws('wss://api.gemini.com/v1/marketdata/ETHUSD');

		w.on('message', msg => {
			const parsedJson: any = JSON.parse(msg);

			if (parsedJson.events[0].type == 'trade') {
				var timestampms = parsedJson.timestampms;

				// console.log(parsedJson.events[0]);

				const item = parsedJson.events[0];

				const dbConn = this.mysqlUtil.dbConn;
				if (dbConn == undefined) {
					geminiTradeFeedUtil.initDB();
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
				this.mysqlUtil.insertDataIntoMysql(EXCHANGE_NAME, item.tid, item.price, item.amount, trade_type, timestampms);
			}
		});

		w.on('open', () => {
			console.log('[Gemini]-WebSocket is open');
		});
	}
}

const geminiTradeFeedUtil = new GeminiTradeFeedUtil();
export default geminiTradeFeedUtil;
