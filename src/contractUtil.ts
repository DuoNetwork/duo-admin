import Web3 from 'web3';
import { Contract } from 'web3/types';
import * as CST from './constants';
import calculator from './calculator';
const Tx = require('ethereumjs-tx');
const abiDecoder = require('abi-decoder');
const schedule = require('node-schedule');
import { Price } from './types';

const DEFAULT_GAS_PRICE = 5e9;
const PRE_RESET_GAS_LIMIT = 120000;
const RESET_GAS_LIMIT = 7880000;

export default class ContractUtil {
	web3: Web3;
	abi: any;
	contract: Contract;

	constructor(web3: Web3) {
		this.web3 = web3;
		this.abi = require('./static/Custodian.json');
		this.contract = new web3.eth.Contract(this.abi['abi'], CST.CUSTODIAN_ADDR);
	}

	async read(name: string) {
		const state: string = await this.contract.methods[name]().call();
		console.log(state);
		return state;
	}

	decode(input: string): string {
		abiDecoder.addABI(this.abi['abi']);
		return abiDecoder.decodeMethod(input);
	}

	generateTxString(abi: Object, input: any[]): string {
		return this.web3.eth.abi.encodeFunctionCall(abi, input);
	}

	createTxCommand(
		nonce: number,
		gasPrice: number,
		gasLimit: number,
		toAddr: string,
		amount: number,
		data: string
	): object {
		return {
			nonce: nonce, // web3.utils.toHex(nonce), //nonce,
			gasPrice: this.web3.utils.toHex(gasPrice),
			gasLimit: this.web3.utils.toHex(gasLimit),
			to: toAddr,
			value: this.web3.utils.toHex(this.web3.utils.toWei(amount.toString(), 'ether')),
			data: data
		};
	}

	signTx(rawTx: object, privateKey: string): string {
		try {
			const tx = new Tx(rawTx);
			tx.sign(new Buffer(privateKey, 'hex'));
			return tx.serialize().toString('hex');
		} catch (err) {
			console.log(err);
			return '';
		}
	}

	async getGasPrice(): Promise<number> {
		const gasPrice: number = await this.web3.eth.getGasPrice();
		console.log('current gasPrice is ' + gasPrice);
		return gasPrice;
	}

	async commitSinglePrice(
		isInception: boolean,
		gasPrice: number,
		gasLimit: number,
		price: number
	) {
		let currentPrice: Price;
		if (price > 0) {
			currentPrice = {
				price: price,
				volume: 0,
				timestamp: Math.floor(Date.now())
			};
		} else {
			currentPrice = await calculator.getPriceFix();
		}
		const priceInWei: number = Number(currentPrice.price) * Math.pow(10, 18);
		const priceInSeconds: number = Math.floor(Number(currentPrice.timestamp) / 1000);
		console.log('ETH price is ' + priceInWei + ' at timestamp ' + priceInSeconds);
		const nonce = await this.web3.eth.getTransactionCount(CST.PF_ADDR);
		const abi = {
			name: isInception ? 'startContract' : 'commitPrice',
			type: 'function',
			inputs: [
				{
					name: 'priceInWei',
					type: 'uint256'
				},
				{
					name: 'timeInSecond',
					type: 'uint256'
				}
			]
		};
		const command = this.generateTxString(abi, [priceInWei, priceInSeconds]);
		// sending out transaction
		this.web3.eth
			.sendSignedTransaction(
				'0x' +
					this.signTx(
						this.createTxCommand(
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

	async commitPrice(argv: string[]) {
		let gasPrice = 5e9;
		let gasLimit = 200000;
		let price = 0;
		for (let i = 3; i < argv.length; i++) {
			const args = argv[i].split('=');
			switch (args[0]) {
				case 'gasPrice':
					gasPrice = Number(args[1]) || gasPrice;
					break;
				case 'gasLimit':
					gasLimit = Number(args[1]) || gasLimit;
					break;
				case 'price':
					price = Number(args[1]) || price;
					break;
				default:
					break;
			}
		}

		const startTime = new Date(Date.now());
		const endTime = new Date(startTime.getTime() + 298000);
		const commitStart = new Date(endTime.getTime() + 1000);
		const rule = new schedule.RecurrenceRule();
		rule.minute = new schedule.Range(0, 59, 5);

		const res = await this.contract.methods.state().call();
		const isInception = Number(res) === 0;
		if (isInception) {
			// contract is in inception state; start contract first and then commit price
			schedule.scheduleJob({ start: startTime, end: endTime, rule: rule }, async () => {
				const web3GasPrice = await this.getGasPrice();
				gasPrice = web3GasPrice || gasPrice;
				console.log('gasPrice price ' + gasPrice + ' gasLimit is ' + gasLimit);
				return this.commitSinglePrice(true, gasPrice, gasLimit + 50000, price);
			});
		}

		schedule.scheduleJob(
			{ start: isInception ? commitStart : startTime, rule: rule },
			async () => {
				const web3GasPrice = await this.getGasPrice();
				gasPrice = web3GasPrice || gasPrice;
				console.log('gasPrice price ' + gasPrice + ' gasLimit is ' + gasLimit);
				return this.commitSinglePrice(false, gasPrice, gasLimit, price);
			}
		);
	}

	async create(argv: string[]) {
		let gasPrice = 5e9;
		let gasLimit = 200000;
		let eth = 0;
		let address = '';
		let privateKey = '';
		for (let i = 3; i < argv.length; i++) {
			const args = argv[i].split('=');
			switch (args[0]) {
				case 'gasPrice':
					gasPrice = Number(args[1]) || gasPrice;
					break;
				case 'gasLimit':
					gasLimit = Number(args[1]) || gasLimit;
					break;
				case 'eth':
					eth = Number(args[1]) || eth;
					break;
				case 'address':
					address = args[1] || address;
					break;
				case 'privateKey':
					privateKey = args[1] || privateKey;
					break;
				default:
					break;
			}
		}
		console.log('the account ' + address + ' is creating tokens with ' + privateKey);
		const nonce = await this.web3.eth.getTransactionCount(address);
		const abi = {
			name: 'create',
			type: 'function',
			inputs: [
				{
					name: 'payFeeInEth',
					type: 'bool'
				}
			]
		};
		const input = [true];
		const command = this.generateTxString(abi, input);
		// sending out transaction
		const web3GasPrice = await this.getGasPrice();
		gasPrice = web3GasPrice || gasPrice;
		console.log('gasPrice price ' + gasPrice + ' gasLimit is ' + gasLimit);
		// gasPrice = gasPrice || await web3.eth.
		this.web3.eth
			.sendSignedTransaction(
				'0x' +
					this.signTx(
						this.createTxCommand(
							nonce,
							gasPrice,
							gasLimit,
							CST.CUSTODIAN_ADDR,
							eth,
							command
						),
						privateKey
					)
			)
			.on('receipt', console.log);
	}

	async trigger(abi: object, input: any[], gasPrice: number, gasLimit: number) {
		const nonce = await this.web3.eth.getTransactionCount(CST.PF_ADDR);
		const command = this.generateTxString(abi, input);
		// sending out transaction
		this.web3.eth
			.sendSignedTransaction(
				'0x' +
					this.signTx(
						this.createTxCommand(
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
		const gasPrice = (await this.getGasPrice()) || DEFAULT_GAS_PRICE;
		console.log('gasPrice price ' + gasPrice + ' gasLimit is ' + RESET_GAS_LIMIT);
		await this.trigger(abi, input, gasPrice, RESET_GAS_LIMIT);
	}

	async triggerPreReset() {
		const abi = {
			name: 'startPreReset',
			type: 'function',
			inputs: []
		};
		const input = [];
		const gasPrice = (await this.getGasPrice()) || DEFAULT_GAS_PRICE;
		console.log('gasPrice price ' + gasPrice + ' gasLimit is ' + PRE_RESET_GAS_LIMIT);
		await this.trigger(abi, input, gasPrice, PRE_RESET_GAS_LIMIT); // 120000 for lastOne; 30000 for else
	}
}
