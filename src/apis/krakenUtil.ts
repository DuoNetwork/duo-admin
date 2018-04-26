import sqlUtil from '../sqlUtil';
import * as CST from '../constants';
import util from '../util';

const INTERVAL_SECS = 2;

let last = 0; // last = id to be used as since when polling for new trade data

export class KrakenUtil {
	parseTrade(trade: object): object {
		let trade_type: string = 'buy';
		const exchange_returned_timestamp = Math.floor(Number(trade[2]) * 1000) + '';

		if (trade[3] == 'b') {
			trade_type = 'buy';
		} else if (trade[3] == 's') {
			trade_type = 'sell';
		}

		return {
			[CST.TRADE_ID]: exchange_returned_timestamp,
			[CST.PRICE]: trade[0],
			[CST.AMOUNT]: trade[1],
			[CST.TRADE_TYPE]: trade_type,
			[CST.EXCHANGE_TIME_STAMP]: exchange_returned_timestamp
		};
	}

	async fetchETHTradesByOwnWebSocket() {
		// const kraken = new Kraken();
		const baseUrl: string = 'https://api.kraken.com/0/public/Trades?pair=ETHUSD';
		let url: string = '';

		if (last == 0) {
			url = baseUrl;
		} else if (last != undefined) {
			url = baseUrl + '&last=' + last + '';
		}
		console.log('request: ' + last + ' length: ' + last.toString().split('.')[0].length);

		try {
			const response: any = await util.get(url);
			const jsonObj = JSON.parse(response);

			const returnFirstLevelArray = jsonObj['result']['XETHZUSD'];
			// console.log(url);
			returnFirstLevelArray.forEach(trade => {
				console.log(trade);
				const parsedTrad: object = krakenUtil.parseTrade(trade);

				sqlUtil.insertSourceData(
					CST.EXCHANGE_KRAKEN,
					parsedTrad[CST.TRADE_ID],
					parsedTrad[CST.PRICE],
					parsedTrad[CST.AMOUNT],
					parsedTrad[CST.TRADE_TYPE],
					parsedTrad[CST.EXCHANGE_TIME_STAMP]
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
