import Web3 from 'web3';
import * as CST from '../constants';
import contractUtil from '../contractUtil';
import eventUtil from './eventUtil';
// const provider = 'https://mainnet.infura.io/Ky03pelFIxoZdAUsr82w';
const provider = 'https://kovan.infura.io/WSDscoNUvMiL1M7TvMNP ';
const web3 = new Web3(new Web3.providers.HttpProvider(provider));
const CustodianABI = require('../static/Custodian.json'); // Custodian Contract ABI
const custodianContract = new web3.eth.Contract(CustodianABI['abi'], CST.CUSTODIAN_ADDR);

export class InfuraEventUtil {
	lastBlk;
	currentBlk;
	constructor() {
		this.lastBlk = CST.INCEPTION_BLK;
	}

	async setCurrentBlockNo() {
		const currentBlk = await web3.eth.getBlockNumber();
		this.currentBlk = currentBlk;
	}
	async subscribeAcceptPriceEvent() {
		console.log('start subscribing to acceptPrice event');
		await this.setCurrentBlockNo();
		while (this.lastBlk < this.currentBlk) {
			console.log(
				'current blk is ' +
					this.currentBlk +
					' last blk is ' +
					this.lastBlk +
					' do subscription'
			);
			custodianContract.getPastEvents(
				'AcceptPrice',
				{
					fromBlock: this.lastBlk + 1,
					toBlock: this.currentBlk
				},
				function(error, events) {
					if (error) {
						console.log(error);
					} else {
						console.log(events);
					}
				}
			);
			this.lastBlk = this.currentBlk;
		}
	}

	async subscribePreResetEvent() {
		console.log('start subscribing to preReset event');
		await this.setCurrentBlockNo();
		console.log('lastBlk is ' + this.lastBlk + 'currentBlk is ' + this.currentBlk);
		const state = await contractUtil.read('state');
		console.log('current state is ' + state);
		if (state === CST.STATE_PRERESET) {
			await eventUtil.triggerPreReset();
		}

		while (this.lastBlk < this.currentBlk) {
			console.log('subscribing event in blk ' + this.lastBlk);
			custodianContract.getPastEvents(
				'StartPreReset',
				{
					fromBlock: this.lastBlk,
					toBlock: this.lastBlk
				},
				async function(error, events) {
					if (error) {
						console.log(error);
					} else if (events.length > 0) {
						console.log(events);
						console.log('start preReset triggering');
						await eventUtil.triggerPreReset();
					}
				}
			);
			this.lastBlk += 1;
		}
	}

	async subscribeResetEvent() {
		console.log('start subscribing to Reset event');
		this.setCurrentBlockNo();
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
			custodianContract.getPastEvents(
				'StartReset',
				{
					fromBlock: this.lastBlk,
					toBlock: this.lastBlk
				},
				async function(error, events) {
					if (error) {
						console.log(error);
					} else if (events.length > 0) {
						console.log(events);
						console.log('start preReset triggering');
						await eventUtil.triggerReset();
					}
				}
			);
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
		switch (event) {
			case 'AcceptPrice':
				setInterval(() => this.subscribeAcceptPriceEvent(), 60 * 1000);
				break;
			case 'PreReset':
				await this.setCurrentBlockNo();
				console.log('current block is ' + this.currentBlk);
				this.lastBlk = Number(this.currentBlk) - 1;
				setInterval(() => this.subscribePreResetEvent(), 10 * 1000);
				break;
			case 'Reset':
				await this.setCurrentBlockNo();
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

const infuraEventUtil = new InfuraEventUtil();
export default infuraEventUtil;
