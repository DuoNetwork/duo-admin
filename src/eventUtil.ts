import { Contract } from 'web3/types';
import * as CST from './constants';
import ContractUtil from './contractUtil';
import util from './util';

export class EventUtil {
	async pull(
		contract: Contract,
		start: number,
		end: number,
		event: string,
		trigger: (any) => Promise<void>
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
					if (error) {
						util.log(error);
					} else if (events.length > 0) {
						util.log(events);
						util.log('start preReset triggering');
						events.forEach(async r => await trigger(r));
					}
				}
			);
		} else util.log('end is less than start');
	}

	async subscribe(argv: string[], contractUtil: ContractUtil, source: string) {
		let event: string = '';
		for (let i = 3; i < argv.length; i++) {
			const args = argv[i].split('=');
			switch (args[0]) {
				case 'event':
					event = args[1];
					break;
				default:
					break;
			}
		}
		util.log('subscribing to ' + event);

		if (source) {
			if (['StartPreReset', 'StartReset'].includes(event)) {
				setInterval(async () => {
					const state = await contractUtil.read('state');
					util.log('current state is ' + state);

					if (event === 'StartPreReset' && state === CST.STATE_PRERESET) {
						await contractUtil.triggerPreReset();
					} else if (
						event === 'StartReset' &&
						[CST.STATE_UP_RESET, CST.STATE_DOWN_RESET, CST.STATE_PERIOD_RESET].includes(
							state
						)
					) {
						await contractUtil.triggerReset();
					}
				}, 15000);
			} else {
				let startBlk = await contractUtil.web3.eth.getBlockNumber();
				let currentBlk = startBlk;
				setInterval(async () => {
					currentBlk = await contractUtil.web3.eth.getBlockNumber();
					this.pull(contractUtil.contract, startBlk, currentBlk, event, (r: any) => {
						util.log(r);
						return Promise.resolve();
					});
					startBlk = currentBlk + 1;
				}, 15000);
			}
		} else {
			let tg: (r: any) => Promise<void> = () => Promise.resolve();
			if (event === 'AcceptPrice') {
				tg = (r: any) => {
					console.log(r);
					return Promise.resolve();
				};
			} else {
				const state = await contractUtil.read('state');
				util.log('current state is ' + state);

				if (event === 'StartPreReset') {
					tg = () => contractUtil.triggerPreReset();
					if (state === CST.STATE_PRERESET) await contractUtil.triggerPreReset();
				} else if (event === 'StartReset') {
					tg = () => contractUtil.triggerReset();
					if (
						[CST.STATE_UP_RESET, CST.STATE_DOWN_RESET, CST.STATE_PERIOD_RESET].includes(
							state
						)
					)
						await contractUtil.triggerReset();
				}
			}

			util.log('starting listening preReset event');
			contractUtil.contract.events[event]({}, async (error, evt) => {
				if (error) {
					util.log(error);
				} else {
					util.log(evt);
					await tg(evt);
				}
			});
		}
	}
}

const eventUtil = new EventUtil();
export default eventUtil;
