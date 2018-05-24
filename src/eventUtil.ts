import { Contract } from 'web3/types';
import * as CST from './constants';
import ContractUtil from './contractUtil';
import { IOption } from './types';
import util from './util';

export class EventUtil {
	public async pull(
		contract: Contract,
		start: number,
		end: number,
		event: string,
		trigger: (r: any) => Promise<void>
	) {
		if (start <= end) {
			util.log('current blk is ' + end + ' last blk is ' + start + ' do subscription');
			contract.getPastEvents(
				event,
				{
					fromBlock: start,
					toBlock: end
				},
				async (error, events) => {
					if (error) util.log(error);
					else if (events.length > 0) {
						util.log(events);
						util.log('start preReset triggering');
						events.forEach(async r => await trigger(r));
					}
				}
			);
			return true;
		} else {
			util.log('end is less than start');
			return false;
		}
	}

	public async subscribe(contractUtil: ContractUtil, option: IOption) {
		util.log('subscribing to ' + option.event);

		if (option.source)
			if ([CST.EVENT_START_PRE_RESET, CST.EVENT_START_RESET].includes(option.event))
				setInterval(async () => {
					const state = await contractUtil.read('state');
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
				let startBlk = await contractUtil.web3.eth.getBlockNumber();
				let currentBlk = startBlk;
				setInterval(async () => {
					currentBlk = await contractUtil.web3.eth.getBlockNumber();
					const pulled = await this.pull(
						contractUtil.contract,
						startBlk,
						currentBlk,
						option.event,
						(r: any) => {
							util.log(r);
							return Promise.resolve();
						}
					);
					if (pulled) startBlk = currentBlk + 1;
				}, 15000);
			}
		else {
			util.log('starting listening ' + option.event);
			let tg: (r: any) => Promise<void> = () => Promise.resolve();
			if (option.event === CST.EVENT_ACCEPT_PRICE)
				tg = (r: any) => {
					util.log(r);
					return Promise.resolve();
				};
			else {
				const state = await contractUtil.read('state');
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
			}

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
