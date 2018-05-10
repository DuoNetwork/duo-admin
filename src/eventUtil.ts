import { Contract } from 'web3/types';
import * as CST from './constants';
import ContractUtil from './contractUtil';
import util from './util';

export class EventUtil {
	async getEtherscanCurrentBlkNo() {
		console.log('getting current blk no');
		const logLink =
			CST.ETHSCAN_API_KOVAN_LINK +
			'module=proxy&action=eth_blockNumber&apikey=' +
			CST.ETHSCAN_API_KEY;
		const res = await util.get(logLink);
		const result = parseInt(JSON.parse(res)['result'], 16);
		console.log(result);
		return result;
	}

	async subscribeEtherscan(
		start: number,
		end: number,
		sha: string,
		trigger: (any) => Promise<void>
	) {
		if (start <= end) {
			console.log('current blk is ' + end + ' last blk is ' + start + ' do subscription');
			const logLink =
				CST.ETHSCAN_API_KOVAN_LINK +
				'module=logs&action=getLogs&fromBlock=' +
				start +
				'&toBlock=' +
				end +
				'&address=' +
				CST.CUSTODIAN_ADDR +
				'&topic0=' +
				sha +
				'&apikey=' +
				CST.ETHSCAN_API_KEY;

			console.log('making a request to etherscan');

			const res = await util.get(logLink);
			const data = JSON.parse(res);
			const result: object[] = data['result'];
			if (result.length > 0) {
				result.forEach(async r => await trigger(r));
			}
		} else console.log('end is less than start');
	}

	async subscribeInfura(
		contract: Contract,
		start: number,
		end: number,
		event: string,
		trigger: (any) => Promise<void>
	) {
		if (start <= end) {
			console.log('current blk is ' + end + ' last blk is ' + start + ' do subscription');
			contract.getPastEvents(
				event,
				{
					fromBlock: start,
					toBlock: end
				},
				async (error, events) => {
					if (error) {
						console.log(error);
					} else if (events.length > 0) {
						console.log(events);
						console.log('start preReset triggering');
						events.forEach(async r => await trigger(r));
					}
				}
			);
		} else console.log('end is less than start');
	}

	async subscribeParity(contract: Contract, eventName, trigger: (any) => Promise<void>) {
		console.log('starting listening preReset event');
		contract.events[eventName](
			{
				fromBlock: CST.INCEPTION_BLK
			},
			async (error, event) => {
				if (error) {
					console.log(error);
				} else {
					console.log(event);
					await trigger(event);
				}
			}
		);
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
		console.log(event);

		if (source === 'etherscan') {
			let startBlk = CST.INCEPTION_BLK;
			let currentBlk = startBlk;
			let interval = 10000;
			let sha = '';
			let tg = (r: any) => Promise.resolve();
			if (event === 'AcceptPrice') {
				sha = CST.ACCEPT_PRICE_EVENT_SHA;
				tg = (r: any) => {
					const price = parseInt(r.topics[1], 16);
					const time = parseInt(r.topics[2], 16);
					console.log('new price accepted: ' + price + ' at ' + time);
					return Promise.resolve();
				};
			} else {
				interval = 20000;
				const state = await contractUtil.read('state');
				console.log('current state is ' + state);

				if (event === 'StartPreReset') {
					sha = CST.START_PRE_RESET_EVENT_SHA;
					tg = (r: any) => contractUtil.triggerPreReset();
					if (state === CST.STATE_PRERESET) await contractUtil.triggerPreReset();
				} else if (event === 'StartReset') {
					sha = CST.START_RESET_EVENT_SHA;
					tg = (r: any) => contractUtil.triggerReset();
					if (
						state === CST.STATE_UP_RESET ||
						state === CST.STATE_DOWN_RESET ||
						state === CST.STATE_PERIOD_RESET
					)
						await contractUtil.triggerReset();
				}
			}

			setInterval(async () => {
				currentBlk = await this.getEtherscanCurrentBlkNo();
				this.subscribeEtherscan(startBlk, currentBlk, sha, tg);
				startBlk = currentBlk + 1;
			}, interval);
		} else if (source === 'infura') {
			let startBlk = CST.INCEPTION_BLK;
			let currentBlk = startBlk;
			let interval = 10000;
			let tg = (r: any) => Promise.resolve();
			if (event === 'AcceptPrice') {
				tg = (r: any) => {
					console.log(r);
					return Promise.resolve();
				};
			} else {
				interval = 20000;
				const state = await contractUtil.read('state');
				console.log('current state is ' + state);

				if (event === 'StartPreReset') {
					tg = (r: any) => contractUtil.triggerPreReset();
					if (state === CST.STATE_PRERESET) await contractUtil.triggerPreReset();
				} else if (event === 'StartReset') {
					tg = (r: any) => contractUtil.triggerReset();
					if (
						state === CST.STATE_UP_RESET ||
						state === CST.STATE_DOWN_RESET ||
						state === CST.STATE_PERIOD_RESET
					)
						await contractUtil.triggerReset();
				}
			}

			setInterval(async () => {
				currentBlk = await contractUtil.web3.eth.getBlockNumber();
				this.subscribeInfura(contractUtil.contract, startBlk, currentBlk, event, tg);
				startBlk = currentBlk + 1;
			}, interval);
		} else {
			if (event === 'AcceptPrice') {
				this.subscribeParity(contractUtil.contract, event, (r: any) => {
					console.log(r);
					return Promise.resolve();
				});
			} else {
				const state = await contractUtil.read('state');
				console.log('current state is ' + state);

				if (event === 'StartPreReset') {
					if (state === CST.STATE_PRERESET) await contractUtil.triggerPreReset();
					this.subscribeParity(contractUtil.contract, event, (r: any) =>
						contractUtil.triggerPreReset()
					);
				} else if (event === 'StartReset') {
					if (
						state === CST.STATE_UP_RESET ||
						state === CST.STATE_DOWN_RESET ||
						state === CST.STATE_PERIOD_RESET
					)
						await contractUtil.triggerReset();

					this.subscribeParity(contractUtil.contract, event, (r: any) =>
						contractUtil.triggerReset()
					);
				}
			}
		}
	}
}

const eventUtil = new EventUtil();
export default eventUtil;
