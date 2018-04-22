'use strict';
var MysqlUtil = require('../Util/sharedMysql');

var dbConn;

const EXCHANGE_NAME = 'GEMINI';
const db_host = 'localhost';
const db_user = 'root';
const db_password = '123456';
const db_name = 'priceFeedDB';
const db_table_name = 'ETH_Trades_Table';

class GeminiTradeFeedUtil {
	initDB() {
		console.log('Init the DB');

		mysqlUtil.setup(EXCHANGE_NAME, db_host, db_user, db_password, db_name, db_table_name);

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
geminiTradeFeedUtil.fetchETHTradesByOwnWebSocket();

/*

{ type: 'trade',
  tid: 3553004418,
  price: '626.99',
  amount: '0.15791304',
  makerSide: 'ask' }

  */
