import * as CST from '../constants';
import dbUtil from '../dbUtil';
import { ITrade } from '../types';
import util from '../util';

const INTERVAL_SECS = 1;
let pushedID: number[] = [];
export class GdaxUtil {
	public parseTrade(trade: { [key: string]: string }): ITrade {
		return {
			source: CST.EXCHANGE_GDAX,
			id: trade.trade_id + '',
			price: Number(trade.price),
			amount: Math.abs(Number(trade.size)),
			timestamp: new Date(trade.time).valueOf()
		};
	}

	public async fetchETHTradesByRestfulAPI() {
		const data = await util.get('https://api.gdax.com:443/products/ETH-USD/trades');
		const parsedData: Array<{ [key: string]: string }> = JSON.parse(data);

		parsedData.forEach(item => {
			// util.log(Number(item.trade_id));
			if (pushedID.indexOf(Number(item.trade_id)) < 0) {
				pushedID.push(Number(item.trade_id));
				dbUtil.insertTradeData(this.parseTrade(item));
				util.log(CST.EXCHANGE_GDAX + ': record inserted: ' + item.trade_id);

				if (pushedID.length > 20000) pushedID = [];
			}
		});
	}

	public startFetching() {
		setInterval(() => this.fetchETHTradesByRestfulAPI(), INTERVAL_SECS * 1000);
	}
}

const gdaxUtil = new GdaxUtil();
export default gdaxUtil;
