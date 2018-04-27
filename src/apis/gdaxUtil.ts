import sqlUtil from '../sqlUtil';
import util from '../util';
import * as CST from '../constants';
import { Trade } from '../types';

const INTERVAL_SECS = 2;

export class GdaxUtil {

	parseTrade(trade: {[key: string]: string}): Trade {
		return {
			source: CST.EXCHANGE_GDAX,
			tradeId: trade.trade_id,
			price: trade.price,
			amount: trade.size,
			tradeType: trade.side,
			sourceTimestamp: new Date(trade.time).valueOf() + ''
		};
	}

	async fetchETHTradesByRestfulAPI() {
		const data = await util.get('https://api.gdax.com:443/products/ETH-USD/trades');
		const parsedData: Array<{ [key: string]: string }> = JSON.parse(data);

		parsedData.forEach(item => {
			// console.log(item);
			sqlUtil.insertSourceData(
				this.parseTrade(item)
			);
		});
	}

	startFetching() {
		setInterval(() => this.fetchETHTradesByRestfulAPI(), INTERVAL_SECS * 1000);
	}
}

const gdaxUtil = new GdaxUtil();
export default gdaxUtil;
