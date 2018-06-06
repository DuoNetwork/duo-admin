import { Contract, EventLog } from 'web3/types';
import * as CST from './constants';
import ContractUtil from './contractUtil';
import dynamoUtil from './database/dynamoUtil';
import { IEvent, IOption } from './types';
import util from './util';

class EventUtil {
	public parseEvent(eventLog: EventLog, timestamp: number): IEvent {
		const returnValue = eventLog.returnValues;
		const output = {
			type: eventLog.event,
			id: eventLog['id'],
			blockHash: eventLog.blockHash,
			blockNumber: eventLog.blockNumber,
			transactionHash: eventLog.transactionHash,
			logStatus: eventLog['type'],
			parameters: {},
			timestamp: timestamp
		};
		for (const key in returnValue)
			if (!util.isNumber(key)) output.parameters[key] = returnValue[key];

		return output;
	}

	public async pull(
		contract: Contract,
		start: number,
		end: number,
		event: string
	): Promise<EventLog[]> {
		util.log('current blk is ' + end + ' last blk is ' + start + ' do subscription');
		return new Promise<EventLog[]>((resolve, reject) =>
			contract.getPastEvents(
				event,
				{
					fromBlock: start,
					toBlock: end
				},
				(error, events) => {
					if (error) reject(error);
					else resolve(events);
				}
			)
		);
	}

	public async subscribe(contractUtil: ContractUtil, option: IOption) {
		util.log('subscribing to ' + option.event);

		if (option.source)
			if ([CST.EVENT_START_PRE_RESET, CST.EVENT_START_RESET].includes(option.event))
				setInterval(async () => {
					const sysState = await contractUtil.readSysStates();
					const state = sysState[0];
					util.log('current state is ' + state);

					if (option.event === CST.EVENT_START_PRE_RESET && state === CST.STATE_PRERESET)
						await contractUtil.triggerPreReset();
					else if (
						option.event === CST.EVENT_START_RESET &&
						[CST.STATE_UP_RESET, CST.STATE_DOWN_RESET, CST.STATE_PERIOD_RESET].includes(
							state
						)
					)
						await contractUtil.triggerReset();
				}, 15000);
			else {
				let startBlk = (await dynamoUtil.readLastBlock()) || CST.INCEPTION_BLK;
				// let startBlk = CST.INCEPTION_BLK;
				util.log('last block number: ' + startBlk);
				setInterval(async () => {
					const currentBlk = await contractUtil.web3.eth.getBlockNumber();
					const block = await contractUtil.web3.eth.getBlock(currentBlk);
					if (startBlk <= currentBlk) {
						const allEvents: IEvent[] = [];
						const promiseList = CST.OTHER_EVENTS.map(async event => {
							const eventLogs: EventLog[] = await this.pull(
								contractUtil.contract,
								startBlk,
								currentBlk,
								event
							);
							eventLogs.forEach(async el => {
								const timestamp = (await contractUtil.web3.eth.getBlock(
									el.blockNumber
								)).timestamp;
								allEvents.push(this.parseEvent(el, timestamp));
							});
						});

						Promise.all(promiseList)
							.then(async () => {
								await dynamoUtil.insertEventData(allEvents);
								await dynamoUtil.insertStatusData({
									[CST.DB_ST_BLOCK]: { N: currentBlk + '' },
									[CST.DB_ST_TS]: { N: block.timestamp + '' },
									[CST.DB_ST_SYSTIME]: { N: util.getNowTimestamp() + '' }
								});
							})
							.catch(err => util.log(err));
					}
					startBlk = currentBlk + 1;
				}, 15000);
			}
		else {
			util.log('starting listening ' + option.event);
			let tg: (r: any) => Promise<void> = () => Promise.resolve();

			if ([CST.EVENT_START_PRE_RESET, CST.EVENT_START_RESET].includes(option.event)) {
				const sysState = await contractUtil.readSysStates();
				const state = sysState[0];
				util.log('current state is ' + state);

				if (option.event === CST.EVENT_START_PRE_RESET) {
					tg = () => contractUtil.triggerPreReset();
					if (state === CST.STATE_PRERESET) await contractUtil.triggerPreReset();
				} else if (option.event === CST.EVENT_START_RESET) {
					tg = () => contractUtil.triggerReset(2);
					if (
						[CST.STATE_UP_RESET, CST.STATE_DOWN_RESET, CST.STATE_PERIOD_RESET].includes(
							state
						)
					)
						await contractUtil.triggerReset();
				}
			} else return Promise.resolve();

			contractUtil.contract.events[option.event]({}, async (error, evt) => {
				if (error) util.log(error);
				else {
					console.log(evt);
					await tg(evt);
				}
			});
		}
	}
}

const eventUtil = new EventUtil();
export default eventUtil;
