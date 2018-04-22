'use strict';
var MysqlUtil = require('../Util/sharedMysql');

var dbConn;

const EXCHANGE_NAME = 'BITFINEX';
const db_host = 'localhost';
const db_user = 'root';
const db_password = '123456';
const db_name = 'priceFeedDB';
const db_table_name = 'ETH_Trades_Table';

class BitfinexTradeFeedUtil {
	constructor() {
		console.log('begin');
	}

	initDB() {
		console.log('Init the DB');

		mysqlUtil.setup(EXCHANGE_NAME, db_host, db_user, db_password, db_name, db_table_name);

		mysqlUtil.initDB();

		dbConn = mysqlUtil.dbConn;
	}

	//Version 2 WebSocket API ---
	fetchETHTradesByOwnWebSocket() {
		const ws = require('ws');
		const w = new ws('wss://api.bitfinex.com/ws/2');

		w.on('message', msg => {
			if (dbConn === undefined) {
				bitfinexTradeFeedUtil.initDB();
			}

			var parsedJson = JSON.parse(msg);
			if (parsedJson != undefined) {
				//handle the snopshot
				if (parsedJson.event === undefined && parsedJson[1] != 'hb' && !(parsedJson[1] == 'te' || parsedJson[1] == 'tu')) {
					// console.log(parsedJson);
					var snopshotArr = parsedJson[1];
					snopshotArr.forEach(element => {
						// console.log("===>"+element);
						var amount = parseFloat(element[2]);
						var trade_type = 'buy';
						if (amount > 0) {
							trade_type = 'buy';
						} else {
							trade_type = 'sell';
						}
						// console.log("=>"+trade_type);
						mysqlUtil.insertDataIntoMysql(EXCHANGE_NAME, element[0], element[3], Math.abs(amount), trade_type, element[1]);
					});
				} else if (parsedJson[1] != 'hb' && parsedJson[1] == 'te') {
					// console.log("<==="+parsedJson);
					parsedJson = parsedJson[2];
					var amount = parseFloat(parsedJson[2]);
					var trade_type = 'buy';
					if (amount > 0) {
						trade_type = 'buy';
					} else {
						trade_type = 'sell';
					}
					// console.log("=>"+trade_type);
					mysqlUtil.insertDataIntoMysql(EXCHANGE_NAME, parsedJson[0], parsedJson[3], Math.abs(amount), trade_type, parsedJson[1]);
				}
			}
		});

		let msg = JSON.stringify({
			event: 'subscribe',
			channel: 'trades',
			symbol: 'ETHUSD'
		});

		w.on('open', () => {
			console.log('[Bitfinex]-WebSocket is open');
			w.send(msg);
			console.log('subscribe trade');
		});

		w.on('close', () => {
			console.log('[Bitfinex]-WebSocket is close now');
			console.log('close DB');
		});
	}
}
let mysqlUtil = new MysqlUtil();
let bitfinexTradeFeedUtil = new BitfinexTradeFeedUtil();
bitfinexTradeFeedUtil.fetchETHTradesByOwnWebSocket();
