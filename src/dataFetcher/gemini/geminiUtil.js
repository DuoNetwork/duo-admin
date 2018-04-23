'use strict';
const MysqlUtil = require('../../utils/mysqlUtil');
import * as CST from '../../constant';

let dbConn;

const EXCHANGE_NAME = CST.EXCHANGE_GEMINI;
const DB_HOST = CST.DB_HOST;
const DB_USER = CST.DB_USER;
const DB_PASSWORD = CST.DB_PASSWORD;
const DB_PRICEFEED = CST.DB_PRICEFEED;
const DB_TABLE_TRADE = CST.DB_TABLE_TRADE;

class GeminiTradeFeedUtil {
	initDB() {
		console.log('Init the DB');

		mysqlUtil.setup(EXCHANGE_NAME, DB_HOST, DB_USER, DB_PASSWORD, DB_PRICEFEED, DB_TABLE_TRADE);

		mysqlUtil.initDB();
	}

	fetchETHTradesByOwnWebSocket() {
		const ws = require('ws');
		const w = new ws('wss://api.gemini.com/v1/marketdata/ETHUSD');

		w.on('message', msg => {
			var parsedJson = JSON.parse(msg);

			if (parsedJson.events[0].type == 'trade') {
				console.log(parsedJson.events[0]);

				var item = parsedJson.events[0];

				dbConn = mysqlUtil.dbConn;
				if (dbConn == undefined) {
					geminiTradeFeedUtil.initDB();
				}

				var trade_type = 'buy';

				if (item.makerSide == 'ask') {
					trade_type = 'buy';
				} else if (item.makerSide == 'bid') {
					trade_type = 'sell';
				}

				// no timestamp returned by exchange so we leave empty there.
				mysqlUtil.insertDataIntoMysql(EXCHANGE_NAME, item.tid, item.price, item.amount, trade_type, '');
			}
		});

		w.on('open', () => {
			console.log('[Gemini]-WebSocket is open');
		});
	}
}
let mysqlUtil = new MysqlUtil();
let geminiTradeFeedUtil = new GeminiTradeFeedUtil();
export default geminiTradeFeedUtil;

/*

{ type: 'trade',
  tid: 3553004418,
  price: '626.99',
  amount: '0.15791304',
  makerSide: 'ask' }

  */
