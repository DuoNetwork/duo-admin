import { Contract } from 'web3/types';
import * as CST from './constants';
import ContractUtil from './contractUtil';
import dynamoUtil from './database/dynamoUtil';
import { IOption } from './types';
import util from './util';

class EventUtil {
	private parseRawEvent(log) {

		const returnValue = log.returnValues;
		const keys = Object.keys(returnValue);
		const output = {
			type : log.event,
			id : log.id,
			blockHash: log.blockHash,
			blockNumber: log.blockNumber,
			transactionHash: log.transactionHash,
			logStatus: log.type,
			eventParas: {}
		};
		for (let i = keys.length / 2; i < keys.length; i++) {
			const key = keys[i];
			output.eventParas[key] = returnValue[key];
		}
		return output;
	}

	public async pull(
		contract: Contract,
		start: number,
		end: number,
		event: string
		// trigger: (r: any) => Promise<void>
	) {
		util.log('current blk is ' + end + ' last blk is ' + start + ' do subscription');
		return new Promise((resolve, reject) => {
			const eventsList: any[] = [];
			return contract.getPastEvents(
				event,
				{
					fromBlock: start,
					toBlock: end
				},
				async (error, events) => {
					if (error) reject(error);
					else if (events.length > 0)
						events.forEach(e => {
							// console.log(JSON.stringify(e));
							eventsList.push(this.parseRawEvent(e));
						});
					// console.log(eventsList);
					resolve(eventsList);
				}
			);
		});
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
				let startBlk = await dynamoUtil.readLastBlock() || CST.INCEPTION_BLK;
				// let startBlk = CST.INCEPTION_BLK;
				util.log('last block number: ' + startBlk);
				setInterval(async () => {
					const currentBlk = await contractUtil.web3.eth.getBlockNumber();
					if (startBlk <= currentBlk) {
						const allEvents: any[] = [];
						const promiseList = CST.OTHER_EVENTS.map(async event => {
							const events = await this.pull(
								contractUtil.contract,
								startBlk,
								currentBlk,
								event
							);
							allEvents.push(events);
						});

						Promise.all(promiseList).then(async () => {
							await dynamoUtil.insertPublicEventData(contractUtil, allEvents);
							const block = await contractUtil.web3.eth.getBlock(currentBlk);
							await dynamoUtil.insertStatusData({
								[CST.DB_ST_BLOCK]: { N: currentBlk + '' },
								[CST.DB_ST_TS]: { N: block.timestamp + '' },
								[CST.DB_ST_SYSTIME]: { N: util.getNowTimestamp() + '' }
							});
						});
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
