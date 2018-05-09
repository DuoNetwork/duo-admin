import Web3 from 'web3';
import * as CST from '../constants';
import contractUtil from '../contractUtil';
import eventUtil from './eventUtil';
// const provider = 'https://mainnet.infura.io/Ky03pelFIxoZdAUsr82w';
// const provider = 'ws://kovan.infura.io/WSDscoNUvMiL1M7TvMNP';
const provider = 'ws://localhost:8546';
// const provider = 'wss://socket.etherscan.io/wshandler';
const web3 = new Web3(new Web3.providers.WebsocketProvider(provider));
const CustodianABI = require('../static/Custodian.json'); // Custodian Contract ABI
const custodianContract = new web3.eth.Contract(CustodianABI['abi'], CST.CUSTODIAN_ADDR);


export class LocalEventUtil {
	subscribeToAcceptPrice() {
		console.log('starting listening acceptPrice event');
		custodianContract.events.AcceptPrice(
			{
				fromBlock: CST.INCEPTION_BLK
			},
			function(error, event) {
				if (error) {
					console.log(error);
				} else {
					console.log(event);
				}
			}
		);
	}

	async subscribePreReset() {
		const state = await contractUtil.read('state');
		console.log(state);
		if (state === CST.STATE_PRERESET) await eventUtil.triggerPreReset();
		console.log('starting listening preReset event');
		custodianContract.events.StartPreReset(
			{
				fromBlock: CST.INCEPTION_BLK
			},
			async (error, event) => {
				if (error) {
					console.log(error);
				} else {
					console.log(event);
					await eventUtil.triggerPreReset();
				}
			}
		);
	}

	async subscribeReset() {
		console.log('starting listening reset event');
		const state = await contractUtil.read('state');
		if (
			state === CST.STATE_UP_RESET ||
			state === CST.STATE_DOWN_RESET ||
			state === CST.STATE_PERIOD_RESET
		) {
			console.log('start triggering reset');
			await eventUtil.triggerReset();
		}
		custodianContract.events.StartReset(
			{
				fromBlock: CST.INCEPTION_BLK
			},
			async (error, event) => {
				if (error) {
					console.log(error);
				} else {
					console.log(event);
					await eventUtil.triggerReset();
				}
			}
		);
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
				this.subscribeToAcceptPrice();
				break;
			case 'PreReset':
				this.subscribePreReset();
				break;
			case 'Reset':
				this.subscribeReset();
				break;
			default:
				console.log('no such event');
				break;
		}
	}
}

const localEventUtil = new LocalEventUtil();
export default localEventUtil;
