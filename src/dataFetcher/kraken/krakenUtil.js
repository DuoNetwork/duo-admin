'use strict';

var MysqlUtil = require('../Utils/sharedMysql');

var dbConn;

const INTERVAL_SECS = 2;

const EXCHANGE_NAME = 'KRANKEN';
const db_host = 'localhost';
const db_user = 'root';
const db_password = '123456';
const db_name = 'priceFeedDB';
const db_table_name = 'ETH_Trades_Table';

var last = 0; // last = id to be used as since when polling for new trade data
var requestJson = '';

class KrankenTradeFeedUtil {
	initDB() {
		console.log('Init the DB');

		mysqlUtil.setup(EXCHANGE_NAME, db_host, db_user, db_password, db_name, db_table_name);

		mysqlUtil.initDB();
	}

	fetchETHTradesByOwnWebSocket() {
		const Kraken = require('kraken-wrapper');

		const kraken = new Kraken();

		if (last == 0) {
			requestJson = { pair: 'ETHUSD' };
		} else if (last != undefined) {
			requestJson = { pair: 'ETHUSD', last: last };
		}
		console.log('request: ' + last + 'length: ' + last.toString().split('.')[0].length);

		kraken
			.getTrades(requestJson)
			.then(response => {
				// var jsonObj= JSON.parse(response);

				dbConn = mysqlUtil.dbConn;

				if (dbConn == undefined) {
					krankenTradeFeedUtil.initDB();
				}

				var returnFirstLevelArray = response.result.XETHZUSD;

				returnFirstLevelArray.forEach(function(secondLevelArr) {
					var trade_type = 'buy';

					if (secondLevelArr[3] == 'b') {
						trade_type = 'buy';
					} else if (secondLevelArr[3] == 's') {
						trade_type = 'sell';
					}
					mysqlUtil.insertDataIntoMysql(EXCHANGE_NAME, '', secondLevelArr[0], secondLevelArr[1], trade_type, secondLevelArr[2]);
				});

				last = response.result.last;
				console.log(last);
			})
			.catch(error => {
				console.log(error);
			});
	}

	startFetching() {
		setInterval(this.fetchETHTradesByOwnWebSocket, INTERVAL_SECS * 1000);
	}
}
let mysqlUtil = new MysqlUtil();
let krankenTradeFeedUtil = new KrankenTradeFeedUtil();
// krankenTradeFeedUtil.fetchETHTradesByOwnWebSocket();
export default krankenTradeFeedUtil;

/*
    https://www.kraken.com/help/api#get-recent-trades

Input:

pair = asset pair to get trade data for
since = return trade data since given id (optional.  exclusive)

Output

<pair_name> = pair name
    array of array entries(<time>, <bid>, <ask>)
last = id to be used as since when polling for new spread data


Kraken实际的return value：
    array of array entries(<time>, <bid>, <ask>)

    price,       amount,         timestamp       trade type
[ '556.70000', '0.81900000', 1524154859.9084, 's', 'l', '' ]
[ '557.62000', '0.30160936', 1524154843.7233, 'b', 'l', '' ]

 */
