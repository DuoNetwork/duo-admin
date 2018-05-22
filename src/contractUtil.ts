import Web3 from 'web3';
import { Contract } from 'web3/types';
import calculator from './calculator';
import * as CST from './constants';
import { IOption, IPrice } from './types';
import util from './util';
const Tx = require('ethereumjs-tx');
const abiDecoder = require('abi-decoder');
const schedule = require('node-schedule');

export default class ContractUtil {
	public web3: Web3;
	public abi: any;
	public contract: Contract;

	constructor(option: IOption) {
		this.web3 = new Web3(
			option.source
				? new Web3.providers.HttpProvider(option.provider)
				: new Web3.providers.WebsocketProvider(option.provider)
		);
		this.abi = require('./static/Custodian.json');
		this.contract = new this.web3.eth.Contract(this.abi.abi, CST.CUSTODIAN_ADDR);
	}

	public async read(name: string) {
		// state, resetPrice, lastPrice, navAInWei, navBInWei, totalSupplyA, totalSupplyB
		const state: string = await this.contract.methods[name]().call();
		console.log(state.valueOf());
		return state;
	}

	public async readSysStates() {
		// state, resetPrice, lastPrice, navAInWei, navBInWei, totalSupplyA, totalSupplyB
		const sysStates: string = await this.contract.methods.getSystemStates().call();
		for (let i = 0; i < sysStates.length; i++) {
			console.log(CST.SYS_STATES[i] + ' : ' + sysStates[i].valueOf());
		}
	}

	public async readUserBalance(option: IOption) {
		if (option.address) {
			const balanceOfEther = await this.web3.eth.getBalance(option.address);
			const balanceOfA = await this.contract.methods.balanceOf(0, option.address).call();
			const balanceOfB = await this.contract.methods.balanceOf(1, option.address).call();
			console.log(
				option.address +
					' ethBalance: ' +
					this.web3.utils.fromWei(balanceOfEther + '', 'ether') +
					' balance A: ' +
					balanceOfA +
					' balance B: ' +
					balanceOfB
			);
			return;
		}
		const sysStates = await this.contract.methods.getSystemStates().call();
		const numOfUser = sysStates[18].valueOf();
		let totalSupplyOfA = 0;
		let totalSupplyOfB = 0;
		if (numOfUser > 0) {
			for (let i = 0; i < numOfUser; i++) {
				const userAddr = await this.contract.methods.users(i).call();
				const balanceOfEther = await this.web3.eth.getBalance(userAddr);
				const balanceOfA = await this.contract.methods.balanceOf(0, userAddr).call();
				const balanceOfB = await this.contract.methods.balanceOf(1, userAddr).call();
				console.log(
					userAddr +
						' ethBalance: ' +
						this.web3.utils.fromWei(balanceOfEther + '', 'ether') +
						' balance A: ' +
						balanceOfA +
						' balance B: ' +
						balanceOfB
				);
				totalSupplyOfA += Number(balanceOfA);
				totalSupplyOfB += Number(balanceOfB);
			}
		}
		console.log('totalSupplyOfA: ' + totalSupplyOfA + ' totalSupplyOfB: ' + totalSupplyOfB);
	}

	public decode(input: string): string {
		abiDecoder.addABI(this.abi.abi);
		const output: string = abiDecoder.decodeMethod(input);
		console.log(output);
		return output;
	}

	public generateTxString(abi: object, input: any[]): string {
		return this.web3.eth.abi.encodeFunctionCall(abi, input);
	}

	public createTxCommand(
		nonce: number,
		gasPrice: number,
		gasLimit: number,
		toAddr: string,
		amount: number,
		data: string
	): object {
		return {
			nonce, // web3.utils.toHex(nonce), //nonce,
			gasPrice: this.web3.utils.toHex(gasPrice),
			gasLimit: this.web3.utils.toHex(gasLimit),
			to: toAddr,
			value: this.web3.utils.toHex(this.web3.utils.toWei(amount.toString(), 'ether')),
			data
		};
	}

	public signTx(rawTx: object, privateKey: string): string {
		try {
			const tx = new Tx(rawTx);
			tx.sign(new Buffer(privateKey, 'hex'));
			return tx.serialize().toString('hex');
		} catch (err) {
			util.log(err);
			return '';
		}
	}

	public async getGasPrice(): Promise<number> {
		const gasPrice: number = await this.web3.eth.getGasPrice();
		util.log('current gasPrice is ' + gasPrice);
		return gasPrice;
	}

	public async commitSinglePrice(
		isInception: boolean,
		gasPrice: number,
		gasLimit: number,
		price: number
	) {
		let currentPrice: IPrice;
		if (price > 0) {
			currentPrice = {
				price: price,
				volume: 0,
				timestamp: Math.floor(Date.now())
			};
		} else {
			currentPrice = await calculator.getPriceFix();
		}
		const priceInWei: string = this.web3.utils.toWei(currentPrice.price + '', 'ether');
		const priceInSeconds: string = Math.floor(Number(currentPrice.timestamp) / 1000) + '';
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
				},
				{
					name: 'aAddr',
					type: 'address'
				},
				{
					name: 'bAddr',
					type: 'address'
				}
			]
		};
		const command = this.generateTxString(abi, [
			priceInWei,
			priceInSeconds,
			this.web3.utils.toChecksumAddress(CST.A_CONTRACT_ADDR),
			this.web3.utils.toChecksumAddress(CST.B_CONTRACT_ADDR)
		]);
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

	public async commitPrice(option: IOption) {
		const startTime = new Date(Date.now());
		const endTime = new Date(startTime.getTime() + 298000);
		const commitStart = new Date(endTime.getTime() + 1000);
		const rule = new schedule.RecurrenceRule();
		rule.minute = new schedule.Range(0, 59, 5);

		const res = await this.contract.methods.state().call();
		const isInception = Number(res) === 0;
		if (isInception) {
			// contract is in inception state; start contract first and then commit price
			schedule.scheduleJob({ start: startTime, end: endTime, rule }, async () => {
				const gasPrice = (await this.getGasPrice()) || option.gasPrice;
				util.log('gasPrice price ' + gasPrice + ' gasLimit is ' + option.gasLimit);
				return this.commitSinglePrice(
					true,
					gasPrice,
					option.gasLimit + 50000,
					option.price
				);
			});
		}

		schedule.scheduleJob({ start: isInception ? commitStart : startTime, rule }, async () => {
			const gasPrice = (await this.getGasPrice()) || option.gasPrice;
			util.log('gasPrice price ' + gasPrice + ' gasLimit is ' + option.gasLimit);
			return this.commitSinglePrice(false, gasPrice, option.gasLimit, option.price);
		});
	}

	public async create(
		address: string,
		privateKey: string,
		gasPrice: number,
		gasLimit: number,
		eth: number,
		nonce: number = -1
	) {
		util.log('the account ' + address + ' is creating tokens with ' + privateKey);
		nonce = nonce === -1 ? await this.web3.eth.getTransactionCount(address) : nonce;
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
		gasPrice = (await this.getGasPrice()) || gasPrice;
		util.log(
			'gasPrice price ' +
				gasPrice +
				' gasLimit is ' +
				gasLimit +
				' nonce ' +
				nonce +
				' eth ' +
				eth
		);
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
			.on('receipt', util.log);
	}

	public async redeem(
		address: string,
		privateKey: string,
		amtA: number,
		amtB: number,
		gasPrice: number,
		gasLimit: number,
		nonce: number = -1
	) {
		util.log('the account ' + address + ' privateKey is ' + privateKey);
		nonce = nonce === -1 ? await this.web3.eth.getTransactionCount(address) : nonce;
		const balanceOfA = await this.contract.methods.balanceOf(0, address).call();
		const balanceOfB = await this.contract.methods.balanceOf(1, address).call();
		console.log('current balanceA: ' + balanceOfA + ' current balanceB: ' + balanceOfB);
		const abi = {
			name: 'redeem',
			type: 'function',
			inputs: [
				{
					name: 'amtInWeiA',
					type: 'uint256'
				},
				{
					name: 'amtInWeiB',
					type: 'uint256'
				},
				{
					name: 'payFeeInEth',
					type: 'bool'
				}
			]
		};
		const input = [amtA, amtB, true];
		const command = this.generateTxString(abi, input);
		// sending out transaction
		gasPrice = (await this.getGasPrice()) || gasPrice;
		util.log(
			'gasPrice price ' +
				gasPrice +
				' gasLimit is ' +
				gasLimit +
				' nonce ' +
				nonce +
				' amtA ' +
				amtA +
				' amtB ' +
				amtB
		);
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
							0,
							command
						),
						privateKey
					)
			)
			.on('receipt', util.log);
	}

	public async transferEth(
		from: string,
		privatekey: string,
		to: string,
		amt: number,
		nonce: number
	) {
		const rawTx = {
			nonce: nonce,
			gasPrice: this.web3.utils.toHex((await this.getGasPrice()) || CST.DEFAULT_GAS_PRICE),
			gasLimit: this.web3.utils.toHex(23000),
			from: from,
			to: to,
			value: this.web3.utils.toHex(this.web3.utils.toWei(amt.toPrecision(3) + '', 'ether'))
		};
		await this.web3.eth
			.sendSignedTransaction('0x' + this.signTx(rawTx, privatekey))
			.on('receipt', util.log);
	}

	public async transferToken(
		index: number,
		address: string,
		privateKey: string,
		to: string,
		value: number,
		gasPrice: number,
		gasLimit: number,
		nonce: number = -1
	) {
		util.log(
			'the account ' +
				address +
				' privateKey is ' +
				privateKey +
				' transfering ' +
				index +
				' to ' +
				to +
				' with amt ' +
				value
		);
		nonce = nonce === -1 ? await this.web3.eth.getTransactionCount(address) : nonce;
		const abi = {
			name: 'transfer',
			type: 'function',
			inputs: [
				{
					name: 'index',
					type: 'uint256'
				},
				{
					name: 'from',
					type: 'address'
				},
				{
					name: 'to',
					type: 'address'
				},
				{
					name: 'tokens',
					type: 'uint256'
				}
			]
		};
		const input = [index, address, to, value];
		const command = this.generateTxString(abi, input);
		// sending out transaction
		gasPrice = (await this.getGasPrice()) || gasPrice;
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
							0,
							command
						),
						privateKey
					)
			)
			.on('receipt', util.log);
	}

	public async trigger(abi: object, input: any[], gasPrice: number, gasLimit: number) {
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

	public async triggerReset(count: number = 1) {
		const abi = {
			name: 'startReset',
			type: 'function',
			inputs: []
		};
		const input = [];
		const gasPrice = (await this.getGasPrice()) || CST.DEFAULT_GAS_PRICE;
		util.log('gasPrice price ' + gasPrice + ' gasLimit is ' + CST.RESET_GAS_LIMIT);
		const promiseList: Array<Promise<void>> = [];
		for (let i = 0; i < count; i++) {
			promiseList.push(this.trigger(abi, input, gasPrice, CST.RESET_GAS_LIMIT));
		}

		await Promise.all(promiseList);
	}

	public async triggerPreReset() {
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
