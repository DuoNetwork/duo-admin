import moment from 'moment';
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
			timestamp: moment(trade.time).valueOf()
		};
	}

	public async fetchETHTrades() {
		const data = await util.get('https://api.gdax.com:443/products/ETH-USD/trades');
		const parsedData: Array<{ [key: string]: string }> = JSON.parse(data);
		let insertStatus: boolean = true;
		parsedData.forEach(item => {
			// util.log(Number(item.trade_id));
			if (pushedID.indexOf(Number(item.trade_id)) < 0) {
				pushedID.push(Number(item.trade_id));
				dbUtil.insertTradeData(this.parseTrade(item), insertStatus);
				insertStatus = false;
				util.log(CST.EXCHANGE_GDAX + ': record inserted: ' + item.trade_id);

				if (pushedID.length > 20000) pushedID = [];
			}
		});
	}

	public startFetching() {
		setInterval(() => this.fetchETHTrades(), INTERVAL_SECS * 1000);
	}
}

const gdaxUtil = new GdaxUtil();
export default gdaxUtil;
