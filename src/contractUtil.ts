import Web3 from 'web3';
import { Contract } from 'web3/types';
import * as CST from './constants';
import calculator from './calculator';
import util from './util';
import { Price, Option } from './types';
const Tx = require('ethereumjs-tx');
const abiDecoder = require('abi-decoder');
const schedule = require('node-schedule');

export default class ContractUtil {
	web3: Web3;
	abi: any;
	contract: Contract;

	constructor(option: Option) {
		this.web3 = new Web3(
			option.source
				? new Web3.providers.HttpProvider(option.provider)
				: new Web3.providers.WebsocketProvider(option.provider)
		);
		this.abi = require('./static/Custodian.json');
		this.contract = new this.web3.eth.Contract(this.abi['abi'], CST.CUSTODIAN_ADDR);
	}

	async read(name: string) {
		const state: string = await this.contract.methods[name]().call();
		util.log(state);
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
			util.log(err);
			return '';
		}
	}

	async getGasPrice(): Promise<number> {
		const gasPrice: number = await this.web3.eth.getGasPrice();
		util.log('current gasPrice is ' + gasPrice);
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
		util.log('ETH price is ' + priceInWei + ' at timestamp ' + priceInSeconds);
		const nonce = await this.web3.eth.getTransactionCount(CST.PF_ADDR);
		const abi = {
			name: isInception ? CST.FN_START_CONTRACT : CST.FN_COMMIT_PRICE,
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
			.on('receipt', util.log);
	}

	async commitPrice(option: Option) {
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
				const gasPrice = (await this.getGasPrice()) || option.gasPrice ;
				util.log('gasPrice price ' + gasPrice + ' gasLimit is ' + option.gasLimit);
				return this.commitSinglePrice(true, gasPrice, option.gasLimit + 50000, option.price);
			});
		}

		schedule.scheduleJob(
			{ start: isInception ? commitStart : startTime, rule: rule },
			async () => {
				const gasPrice = (await this.getGasPrice()) || option.gasPrice ;
				util.log('gasPrice price ' + gasPrice + ' gasLimit is ' + option.gasLimit);
				return this.commitSinglePrice(false, gasPrice, option.gasLimit, option.price);
			}
		);
	}

	async create(option: Option) {
		util.log('the account ' + option.address + ' is creating tokens with ' + option.privateKey);
		const nonce = await this.web3.eth.getTransactionCount(option.address);
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
		const gasPrice = (await this.getGasPrice()) || option.gasPrice ;
		util.log('gasPrice price ' + gasPrice + ' gasLimit is ' + option.gasLimit);
		// gasPrice = gasPrice || await web3.eth.
		this.web3.eth
			.sendSignedTransaction(
				'0x' +
					this.signTx(
						this.createTxCommand(
							nonce,
							gasPrice,
							option.gasLimit,
							CST.CUSTODIAN_ADDR,
							option.eth,
							command
						),
						option.privateKey
					)
			)
			.on('receipt', util.log);
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
			.on('receipt', util.log);
	}

	async triggerReset() {
		const abi = {
			name: 'startReset',
			type: 'function',
			inputs: []
		};
		const input = [];
		const gasPrice = (await this.getGasPrice()) || CST.DEFAULT_GAS_PRICE;
		util.log('gasPrice price ' + gasPrice + ' gasLimit is ' + CST.RESET_GAS_LIMIT);
		await this.trigger(abi, input, gasPrice, CST.RESET_GAS_LIMIT);
	}

	async triggerPreReset() {
		const abi = {
			name: 'startPreReset',
			type: 'function',
			inputs: []
		};
		const input = [];
		const gasPrice = (await this.getGasPrice()) || CST.DEFAULT_GAS_PRICE;
		util.log('gasPrice price ' + gasPrice + ' gasLimit is ' + CST.PRE_RESET_GAS_LIMIT);
		await this.trigger(abi, input, gasPrice, CST.PRE_RESET_GAS_LIMIT); // 120000 for lastOne; 30000 for else
	}
}
