import moment from 'moment';
import calculator from './calculator';
import * as CST from './constants';
import dynamoUtil from './database/dynamoUtil';

// import { ITrade } from './types';
import util from './util';
// import dbUtil from './dbUtil';

class OhlcUtil {
	public async saveMinutelyData(numOfMinutes: number = 2) {
		util.log('processing minute trade data');
		const now = moment.utc();
		const timestamp = now.valueOf();

		const datetimeToRequest: string[] = [];
		for (let i = 0; i < numOfMinutes; i++)
			// const minute = Number(now.split('-')[4]) - i
			datetimeToRequest.push(now.subtract(1, 'minutes').format('YYYY-MM-DD-HH-mm'));

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
											calculator.getOHLC(trades, timestamp)
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

	// public async saveHourlyData(numOfHours: number = 2) {

	// }

	// public startProcessHour() {
	// 	setInterval(() => this.saveHourlyData(), 300000);
	// }
}

const ohlcUtil = new OhlcUtil();
export default ohlcUtil;
