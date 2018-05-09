import Web3 from 'web3';
import * as CST from '../constants';
import contractUtil from '../contractUtil';
// const provider = 'https://mainnet.infura.io/Ky03pelFIxoZdAUsr82w';
// const provider = 'ws://kovan.infura.io/WSDscoNUvMiL1M7TvMNP';
const provider = 'ws://localhost:8546';
// const provider = 'wss://socket.etherscan.io/wshandler';
const web3 = new Web3(new Web3.providers.WebsocketProvider(provider));
const CustodianABI = require('../static/Custodian.json'); // Custodian Contract ABI
const custodianContract = new web3.eth.Contract(CustodianABI['abi'], CST.CUSTODIAN_ADDR);

let gasPrice: number = 5e9;
const gasLimitPreReset = 120000;
const gasLimitReset = 7880000;

export class EventUtil {
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

	async trigger(abi: object, input: any[], gasPrice: number, gasLimit: number) {
		const nonce = await web3.eth.getTransactionCount(CST.PF_ADDR);
		const command = contractUtil.generateTxString(abi, input);
		// sending out transaction
		web3.eth
			.sendSignedTransaction(
				'0x' +
					contractUtil.signTx(
						contractUtil.createTxCommand(
							nonce,
							gasPrice,
							gasLimit,
							CST.CUSTODIAN_ADDR,
							0,
							command
						),
						CST.PF_ADDR_PK
					)
			)
			.on('receipt', console.log);
	}

	async triggerReset() {
		const abi = {
			name: 'startReset',
			type: 'function',
			inputs: []
		};
		const input = [];
		const web3GasPrice = await contractUtil.getGasPrice();
		gasPrice = web3GasPrice || gasPrice;
		console.log('gasPrice price ' + gasPrice + ' gasLimit is ' + gasLimitReset);
		await this.trigger(abi, input, gasPrice, gasLimitReset);
	}

	async triggerPreReset() {
		const abi = {
			name: 'startPreReset',
			type: 'function',
			inputs: []
		};
		const input = [];
		const web3GasPrice = await contractUtil.getGasPrice();
		gasPrice = web3GasPrice || gasPrice;
		console.log('gasPrice price ' + gasPrice + ' gasLimit is ' + gasLimitPreReset);
		await this.trigger(abi, input, gasPrice, gasLimitPreReset);  // 120000 for lastOne; 30000 for else
	}

	async subscribePreReset() {
		const state = await contractUtil.read('state');
		console.log(state);
		if (state === CST.STATE_PRERESET) await this.triggerPreReset();
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
					await this.triggerPreReset();
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
			await this.triggerReset();
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
					await this.triggerReset();
				}
			}
		);
	}
}

const eventUtil = new EventUtil();
export default eventUtil;
