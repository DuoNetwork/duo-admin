import mysqlUtil from '../mysqlUtil';
import * as CST from '../constants';
const Kraken = require('kraken-wrapper');

// let dbConn;

const INTERVAL_SECS = 2;

let last = 0; // last = id to be used as since when polling for new trade data
let requestJson: object = {};

export class KrakenUtil {
	async fetchETHTradesByOwnWebSocket() {
		const kraken = new Kraken();

		if (last == 0) {
			requestJson = { pair: 'ETHUSD' };
		} else if (last != undefined) {
			requestJson = { pair: 'ETHUSD', last: last };
		}
		console.log('request: ' + last + 'length: ' + last.toString().split('.')[0].length);

		try {
			const response = await kraken.getTrades(requestJson);
			// var jsonObj= JSON.parse(response);

			const returnFirstLevelArray = response.result.XETHZUSD;
			// console.log(returnFirstLevelArray);

			returnFirstLevelArray.forEach(secondLevelArr => {
				let trade_type: string = 'buy';
				const exchange_returned_timestamp =
					Math.floor(Number(secondLevelArr[2]) * 1000) + '';

				if (secondLevelArr[3] == 'b') {
					trade_type = 'buy';
				} else if (secondLevelArr[3] == 's') {
					trade_type = 'sell';
				}
				mysqlUtil.insertDataIntoMysql(
					CST.EXCHANGE_KRAKEN,
					'',
					secondLevelArr[0],
					secondLevelArr[1],
					trade_type,
					exchange_returned_timestamp
				);
			});

			last = response.result.last;
			console.log(last);
		} catch (error) {
			console.log(error);
		}
	}

	startFetching() {
		setInterval(this.fetchETHTradesByOwnWebSocket, INTERVAL_SECS * 1000);
	}
}
const krakenUtil = new KrakenUtil();
export default krakenUtil;
