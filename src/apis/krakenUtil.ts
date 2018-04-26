import sqlUtil from '../sqlUtil';
import * as CST from '../constants';
import util from '../util';


const INTERVAL_SECS = 2;

let last = 0; // last = id to be used as since when polling for new trade data

export class KrakenUtil {
	async fetchETHTradesByOwnWebSocket() {
		// const kraken = new Kraken();
		const baseUrl: string = 'https://api.kraken.com/0/public/Trades?pair=ETHUSD';
		let url: string = '';

		if (last == 0) {
			url = baseUrl;
		} else if (last != undefined) {
			url = baseUrl + '&last=' + last + '';
		}
		console.log('request: ' + last + 'length: ' + last.toString().split('.')[0].length);

		try {
			const response: any = await util.get(url);
			const jsonObj = JSON.parse(response);

			const returnFirstLevelArray = jsonObj['result']['XETHZUSD'];

			returnFirstLevelArray.forEach(secondLevelArr => {
				let trade_type: string = 'buy';
				const exchange_returned_timestamp =
					Math.floor(Number(secondLevelArr[2]) * 1000) + '';

				if (secondLevelArr[3] == 'b') {
					trade_type = 'buy';
				} else if (secondLevelArr[3] == 's') {
					trade_type = 'sell';
				}
				sqlUtil.insertSourceData(
					CST.EXCHANGE_KRAKEN,
					'',
					secondLevelArr[0],
					secondLevelArr[1],
					trade_type,
					exchange_returned_timestamp
				);
			});

			last = jsonObj['result']['last'];
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
