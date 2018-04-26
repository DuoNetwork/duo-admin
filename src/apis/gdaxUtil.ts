import mysqlUtil from '../mysqlUtil';
import util from '../util';
import * as CST from '../constants';

const INTERVAL_SECS = 2;

export class GdaxUtil {
	async fetchETHTradesByRestfulAPI() {
		const data = await util.get('https://api.gdax.com:443/products/ETH-USD/trades');
		const parsedData: Array<{ [key: string]: string }> = JSON.parse(data);

		parsedData.forEach(item => {
			mysqlUtil.insertDataIntoMysql(
				CST.EXCHANGE_GDAX,
				item.trade_id,
				item.price,
				item.size,
				item.side,
				new Date(item.time).valueOf() + ''
			);
		});
	}

	startFetching() {
		setInterval(this.fetchETHTradesByRestfulAPI, INTERVAL_SECS * 1000);
	}
}

const gdaxUtil = new GdaxUtil();
export default gdaxUtil;
