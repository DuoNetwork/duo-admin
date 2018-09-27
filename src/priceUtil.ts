import moment from 'moment';
import ContractUtil from '../../duo-contract-util/src/contractUtil';
import calculator from './calculator';
import * as CST from './constants';
import dynamoUtil from './database/dynamoUtil';
import { IOption } from './types';
import util from './util';
const schedule = require('node-schedule');

class PriceUtil {
	public async startCommitPrices(
		address: string,
		key: string,
		contractUtil: ContractUtil,
		option: IOption
	) {
		const startTime = new Date();
		const endTime = new Date(startTime.getTime() + 3500000);
		const commitStart = new Date(endTime.getTime() + 50000);
		const rule = new schedule.RecurrenceRule();
		// rule.hour = new schedule.Range(0, 23, 1);
		rule.minute = 0;

		const sysStates = await contractUtil.contract.methods.getSystemStates().call();
		const isInception = Number(sysStates[0]) === 0;

		if (isInception)
			// contract is in inception state; start contract first and then commit price
			schedule.scheduleJob({ start: startTime, end: endTime, rule }, async () => {
				const currentPrice = await calculator.getPriceFix();
				const gasPrice = (await contractUtil.getGasPrice()) || option.gasPrice;
				util.log('gasPrice price ' + gasPrice + ' gasLimit is ' + option.gasLimit);
				return contractUtil.commitPrice(
					address,
					key,
					currentPrice.price,
					currentPrice.timestamp,
					gasPrice,
					option.gasLimit + 50000,
					true
				);
			});

		schedule.scheduleJob({ start: isInception ? commitStart : startTime, rule }, async () => {
			const currentPrice = await calculator.getPriceFix();
			const gasPrice = (await contractUtil.getGasPrice()) || option.gasPrice;
			util.log('gasPrice price ' + gasPrice + ' gasLimit is ' + option.gasLimit);
			return contractUtil.commitPrice(
				address,
				key,
				currentPrice.price,
				currentPrice.timestamp,
				gasPrice,
				option.gasLimit
			);
		});
	}

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

	public startProcessMinutelyPrices(option: IOption) {
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

	public startProcessHourlyPrices(option: IOption) {
		const numOfHours: number = option.numOfHours > 2 ? option.numOfHours : 2;
		setInterval(() => this.saveHourlyData(numOfHours), 300000);
	}
}

const priceUtil = new PriceUtil();

export default priceUtil;
