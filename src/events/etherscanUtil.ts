import * as CST from '../constants';
import util from '../util';
import contractUtil from '../contractUtil';
import eventUtil from './eventUtil';
const web3 = require('web3');

export class EtherscanUtil {
	lastBlk;
	currentBlk;
	constructor() {
		this.lastBlk = CST.INCEPTION_BLK;
	}

	async setCurrentBlkNo() {
		console.log('getting current blk no');
		const logLink =
			CST.ETHSCAN_API_KOVAN_LINK +
			'module=proxy&action=eth_blockNumber&apikey=' +
			CST.ETHSCAN_API_KEY;
		const res = await util.get(logLink);
		const data = JSON.parse(res);
		const result = parseInt(data['result'], 16);
		console.log(result);
		this.currentBlk = result;
	}

	async subscribeAcceptPriceEvent() {
		console.log('start subscribing to acceptPrice event');
		await this.setCurrentBlkNo();
		while (this.lastBlk < this.currentBlk) {
			console.log(
				'current blk is ' +
					this.currentBlk +
					' last blk is ' +
					this.lastBlk +
					' do subscription'
			);
			const fromBlk = this.lastBlk + 1 + '';
			const logLink =
				CST.ETHSCAN_API_KOVAN_LINK +
				'module=logs&action=getLogs&fromBlock=' +
				fromBlk +
				'&toBlock=' +
				this.currentBlk +
				'&address=' +
				CST.CUSTODIAN_ADDR +
				'&topic0=' +
				web3.utils.sha3(CST.ACCEPT_PRICE_EVENT) +
				'&apikey=' +
				CST.ETHSCAN_API_KEY;

			console.log('making a request to etherscan');

			const res = await util.get(logLink);
			const data = JSON.parse(res);
			const result = data['result'];
			// console.log(result);
			for (let i = 0; i < result.length; i++) {
				const price = parseInt(result[i].topics[1], 16);
				const time = parseInt(result[i].topics[2], 16);
				console.log('new price accepted: ' + price + ' at ' + time);
				// console.log(time);
			}
			this.lastBlk = this.currentBlk;
		}
	}

	async subscribePreResetEvent() {
		console.log('start subscribing to preReset event');
		await this.setCurrentBlkNo();
		console.log('lastBlk is ' + this.lastBlk + 'currentBlk is ' + this.currentBlk);
		const state = await contractUtil.read('state');
		console.log('current state is ' + state);
		if (state === CST.STATE_PRERESET) {
			await eventUtil.triggerPreReset();
		}

		while (this.lastBlk < this.currentBlk) {
			console.log('subscribing event in blk ' + this.lastBlk);
			const logLink =
				CST.ETHSCAN_API_KOVAN_LINK +
				'module=logs&action=getLogs&fromBlock=' +
				this.lastBlk +
				'&toBlock=' +
				this.lastBlk +
				'&address=' +
				CST.CUSTODIAN_ADDR +
				'&topic0=' +
				web3.utils.sha3(CST.START_PRE_RESET_EVENT) +
				'&apikey=' +
				CST.ETHSCAN_API_KEY;

			console.log('making a request to etherscan');

			const res = await util.get(logLink);
			const data = JSON.parse(res);
			const result = data['result'];
			if (result.length > 0) {
				for (let i = 0; i < result.length; i++) {
					await eventUtil.triggerPreReset();
					// console.log(time);
				}
			}

			this.lastBlk += 1;
		}
	}

	async subscribeResetEvent() {
		console.log('start subscribing to Reset event');
		this.setCurrentBlkNo();
		console.log('lastBlk is ' + this.lastBlk + 'currentBlk is ' + this.currentBlk);
		const state = await contractUtil.read('state');
		console.log('current state is ' + state);
		if (
			state === CST.STATE_UP_RESET ||
			state === CST.STATE_DOWN_RESET ||
			state === CST.STATE_PERIOD_RESET
		) {
			console.log('start triggering reset');
			await eventUtil.triggerReset();
		}

		while (this.lastBlk < this.currentBlk) {
			console.log('subscribing event in blk ' + this.lastBlk);
			const logLink =
				CST.ETHSCAN_API_KOVAN_LINK +
				'module=logs&action=getLogs&fromBlock=' +
				this.lastBlk +
				'&toBlock=' +
				this.lastBlk +
				'&address=' +
				CST.CUSTODIAN_ADDR +
				'&topic0=' +
				web3.utils.sha3(CST.START_RESET_EVENT) +
				'&apikey=' +
				CST.ETHSCAN_API_KEY;

			console.log('making a request to etherscan');

			const res = await util.get(logLink);
			const data = JSON.parse(res);
			const result = data['result'];
			if (result.length > 0) {
				for (let i = 0; i < result.length; i++) {
					await eventUtil.triggerReset();
					// console.log(time);
				}
			}
			this.lastBlk += 1;
		}
	}

	async startSubscribing(argv: string[]) {
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
		switch (event) {
			case 'AcceptPrice':
				setInterval(() => this.subscribeAcceptPriceEvent(), 10 * 1000);
				break;
			case 'PreReset':
				await this.setCurrentBlkNo();
				console.log('current block is ' + this.currentBlk);
				this.lastBlk = Number(this.currentBlk) - 1;
				setInterval(() => this.subscribePreResetEvent(), 20 * 1000);
				break;
			case 'Reset':
				await this.setCurrentBlkNo();
				console.log('current block is ' + this.currentBlk);
				this.lastBlk = Number(this.currentBlk) - 1;
				setInterval(() => this.subscribeResetEvent(), 10 * 1000);
				break;
			default:
				console.log('no such event');
				break;
		}
	}
}

const etherscanUtil = new EtherscanUtil();
export default etherscanUtil;
