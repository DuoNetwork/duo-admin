import sqlUtil from '../sqlUtil';
import * as CST from '../constants';
import util from '../util';
import { Trade } from '../types';

const INTERVAL_SECS = 2;

let last = 0; // last = id to be used as since when polling for new trade data

export class KrakenUtil {
	parseTrade(trade: object): Trade {
		const exchangeReturnedTimestamp = Math.floor(Number(trade[2]) * 1000);
		return {
			source: CST.EXCHANGE_KRAKEN,
			id: exchangeReturnedTimestamp + '',
			price: Number(trade[0]),
			amount: Math.abs(Number(trade[1])),
			timestamp: exchangeReturnedTimestamp
		};
	}

	parseApiResponse(response: string) {
		const jsonObj = JSON.parse(response);

		const returnFirstLevelArray = jsonObj['result']['XETHZUSD'];
		// util.log(url);
		let count = 0;
		returnFirstLevelArray.forEach(trade => {
			// util.log(trade);
			const parsedTrade: Trade = krakenUtil.parseTrade(trade);
			if (Number(parsedTrade.id) >= Math.floor(Number(last) / 1000000)) {
				sqlUtil.insertSourceData(parsedTrade);
				count++;
			}
		});

		util.log('inserted ' + count + ' trades of ' + returnFirstLevelArray.length + ' received');

		last = jsonObj['result']['last'];
		util.log(last);
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
		util.log('request: ' + last + ' length: ' + last.toString().split('.')[0].length);

		try {
			const response: any = await util.get(url);
			this.parseApiResponse(response.toString());
		} catch (error) {
			util.log(error);
		}
	}

	startFetching() {
		setInterval(() => this.fetchETHTradesByOwnWebSocket(), INTERVAL_SECS * 1000);
	}
}
const krakenUtil = new KrakenUtil();
export default krakenUtil;
