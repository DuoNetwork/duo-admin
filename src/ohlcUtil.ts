import moment from 'moment';
import calculator from './calculator';
import * as CST from './constants';
import dynamoUtil from './database/dynamoUtil';
import util from './util';

class OhlcUtil {
	public async saveMinutelyData(numOfMinutes: number = 2) {
		util.log('processing minute trade data');
		const now = moment.utc();
		const timestamp = now.valueOf();

		const datetimeToRequest: string[] = [];
		for (let i = 0; i < numOfMinutes; i++) {
			datetimeToRequest.push(now.format('YYYY-MM-DD-HH-mm'));
			now.subtract(1, 'minutes');
		}

		const promiseList: Array<Promise<void>> = [];
		CST.EXCHANGES.forEach(src =>
			datetimeToRequest.forEach(dt =>
				promiseList.push(
					dynamoUtil
						.readTradeData(src, dt)
						.then(
							trades =>
								trades.length
									? dynamoUtil.insertMinutelyData(
											calculator.getMinutelyOHLCFromTrades(trades, timestamp)
									)
									: Promise.resolve()
						)
				)
			)
		);

		await Promise.all(promiseList);
		util.log('completed processing!');
	}

	public startProcessMinute() {
		setInterval(() => this.saveMinutelyData(), 60000);
	}

	public async saveHourlyData(numOfHours: number = 2) {
		util.log('processing hourly trade data');
		const now = moment.utc();
		const timestamp = now.valueOf();
		const datetimeToRequest: string[] = [];
		for (let i = 0; i < numOfHours; i++) {
			datetimeToRequest.push(now.format('YYYY-MM-DD-HH'));
			now.subtract(1, 'hours');
		}
		// console.log(datetimeToRequest);
		const promiseList: Array<Promise<void>> = [];
		CST.EXCHANGES.forEach(src =>
			datetimeToRequest.forEach(dt =>
				promiseList.push(
					dynamoUtil
						.readMinutelyData(src, dt)
						.then(
							bars =>
								bars.length
									? dynamoUtil.insertHourlyData(
											calculator.getHourlyOHLCFromPriceBars(bars, timestamp)
									)
									: Promise.resolve()
						)
				)
			)
		);

		await Promise.all(promiseList);
		util.log('completed processing!');
	}

	public startProcessHour() {
		setInterval(() => this.saveHourlyData(), 5000);
	}
}

const ohlcUtil = new OhlcUtil();
export default ohlcUtil;
