'use strict';
var math = require('mathjs');

var MysqlUtil = require('../Util/sharedMysql');

var dbConn;

const EXCHANGE_NAME = 'COINBASE_GDAX';
const db_host = 'localhost';
const db_user = 'root';
const db_password = '123456';
const db_name = 'priceFeedDB';
const db_table_name = 'ETH_Trades_Table';

class CoinbaseGDAXTradeFeedUtil {
	initDB() {
		console.log('Init the DB');

		mysqlUtil.setup(EXCHANGE_NAME, db_host, db_user, db_password, db_name, db_table_name);

		mysqlUtil.initDB();

		dbConn = mysqlUtil.dbConn;
	}

	fetchETHTradesByOwnWebSocket() {
		var https = require('https');

		var options = {
			host: 'api.gdax.com',
			path: '/products/ETH-USD/trades',
			port: '443',
			//This is the only line that is new. `headers` is an object with the headers to request
			headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10; rv:33.0) Gecko/20100101 Firefox/33.0' }
		};

		var callbackFunc = function(response) {
			var responseStr = '';
			response.on('data', function(chunk) {
				responseStr += chunk;
			});

			response.on('end', function() {
				// console.log(str);

				console.log(responseStr);
				console.log('type:' + Object.prototype.toString(responseStr));
				var tradeObj = JSON.parse(responseStr);

				tradeObj.forEach(function(item) {
					console.log(item);
				});
			});
		};

		/*

output is:

{ time: '2018-04-22T03:37:51.027Z',
  trade_id: 32537453,
  price: '601.59000000',
  size: '0.01000000',
  side: 'buy' }

{ time: '2018-04-22T03:37:51.82Z',
  trade_id: 32537459,
  price: '601.37000000',
  size: '2.01374149',
  side: 'sell' }

  */

		var req = https.request(options, callbackFunc);
		req.end();
	}
}

let mysqlUtil = new MysqlUtil();
let coinbaseGDAXTradeFeedUtil = new CoinbaseGDAXTradeFeedUtil();
coinbaseGDAXTradeFeedUtil.fetchETHTradesByOwnWebSocket();
