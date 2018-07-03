import { Contract, EventLog } from 'web3/types';
import * as CST from './constants';
import ContractUtil from './contractUtil';
import dynamoUtil from './database/dynamoUtil';
import { IEvent, IOption } from './types';
import util from './util';

class EventUtil {
	public parseEvent(eventLog: EventLog, timestamp: number): IEvent {
		const returnValue = eventLog.returnValues;
		const output: IEvent = {
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

					dynamoUtil.insertHeartbeat();
				}, 15000);
			else {
				let startBlk = option.force
					? CST.INCEPTION_BLK
					: Math.max(await dynamoUtil.readLastBlock(), CST.INCEPTION_BLK);
				util.log('starting blk number: ' + startBlk);
				let isProcessing = false;
				const fetch = async () => {
					if (isProcessing) return;

					isProcessing = true;
					const currentBlk = await contractUtil.web3.eth.getBlockNumber();
					while (startBlk <= currentBlk) {
						// const block = await contractUtil.web3.eth.getBlock(startBlk);
						// let timestamp = block.timestamp * 1000;
						const allEvents: IEvent[] = [];
						const end = Math.min(startBlk + CST.EVENT_FETCH_BLOCK_INTERVAL, currentBlk);
						const promiseList = CST.EVENTS.map(event =>
							this.pull(contractUtil.contract, startBlk, end, event)
						);

						const results = await Promise.all(promiseList);
						for (const result of results)
							for (const el of result) {
								const block = await contractUtil.web3.eth.getBlock(el.blockNumber);
								allEvents.push(this.parseEvent(el, block.timestamp * 1000));
							}

						util.log(
							'total ' +
								allEvents.length +
								' events from block ' +
								startBlk +
								' to ' +
								end
						);
						if (allEvents.length > 0) await dynamoUtil.insertEventsData(allEvents);
						await dynamoUtil.insertHeartbeat({
							[CST.DB_ST_BLOCK]: { N: end + '' }
						});
						startBlk = end + 1;
					}
					isProcessing = false;
				};
				fetch();
				setInterval(() => fetch(), CST.EVENT_FETCH_TIME_INVERVAL);
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
					tg = () => contractUtil.triggerReset();
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

			setInterval(() => dynamoUtil.insertHeartbeat(), 30000);
		}
	}
}

const eventUtil = new EventUtil();
export default eventUtil;
