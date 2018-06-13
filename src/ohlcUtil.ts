import moment from 'moment';
import calculator from './calculator';
import * as CST from './constants';
import dynamoUtil from './database/dynamoUtil';
import { IOption } from './types';
import util from './util';

class OhlcUtil {
	public async saveMinutelyData(numOfMinutes: number) {
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

	public startProcessMinute(option: IOption) {
		const numOfMinutes = option.numOfMinutes > 2 ? option.numOfMinutes : 2;
		setInterval(() => this.saveMinutelyData(numOfMinutes), 60000);
	}

	public async saveHourlyData(numOfHours: number) {
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

	public startProcessHour(option: IOption) {
		const numOfHours: number = option.numOfHours > 2 ? option.numOfHours : 2;
		setInterval(() => this.saveHourlyData(numOfHours), 300000);
	}
}

const ohlcUtil = new OhlcUtil();
export default ohlcUtil;
