import * as CST from '../constants';
import sqlUtil from '../sqlUtil';
import { ITrade } from '../types';
import util from '../util';

const INTERVAL_SECS = 2;

export class GdaxUtil {
	public parseTrade(trade: { [key: string]: string }): ITrade {
		return {
			source: CST.EXCHANGE_GDAX,
			id: trade.trade_id,
			price: Number(trade.price),
			amount: Math.abs(Number(trade.size)),
			timestamp: new Date(trade.time).valueOf()
		};
	}

	public async fetchETHTradesByRestfulAPI() {
		const data = await util.get('https://api.gdax.com:443/products/ETH-USD/trades');
		const parsedData: Array<{ [key: string]: string }> = JSON.parse(data);

		parsedData.forEach(item => {
			// util.log(item);
			sqlUtil.insertSourceData(this.parseTrade(item));
		});
	}

	public startFetching() {
		setInterval(() => this.fetchETHTradesByRestfulAPI(), INTERVAL_SECS * 1000);
	}
}

const gdaxUtil = new GdaxUtil();
export default gdaxUtil;
