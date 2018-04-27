import Web3 from 'web3';
import * as CST from './constants';
import util from './util';
import calculateor from './calculator';
const Tx = require('ethereumjs-tx');
const abiDecoder = require('abi-decoder');
const schedule = require('node-schedule');
import { Price } from './types';

// const provider = 'https://mainnet.infura.io/Ky03pelFIxoZdAUsr82w';
const provider = 'https://kovan.infura.io/WSDscoNUvMiL1M7TvMNP ';
const web3 = new Web3(new Web3.providers.HttpProvider(provider));
const CustodianABI = require('./static/Custodian.json'); // Custodian Contract ABI
const custodianContract = new web3.eth.Contract(CustodianABI['abi'], CST.CUSTODIAN_ADDR);

export class ContractUtil {
	async read(name: string) {
		console.log(await custodianContract.methods[name]().call());
	}

	decode(input) {
		abiDecoder.addABI(CustodianABI['abi']);
		return abiDecoder.decodeMethod(input);
	}

	generateTxString(priceInWei: number, priceInSeconds: number, name: string): string {
		return web3.eth.abi.encodeFunctionCall(
			{
				name: name,
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
			},
			[priceInWei, priceInSeconds]
		);
	}

	createTxCommand(
		nonce: number,
		gas_price: number,
		gas_limit: number,
		to_address: string,
		amount: number,
		data: string
	): object {
		return {
			nonce: nonce, // web3.utils.toHex(nonce), //nonce,
			gasPrice: web3.utils.toHex(gas_price),
			gasLimit: web3.utils.toHex(gas_limit),
			to: to_address,
			value: web3.utils.toHex(web3.utils.toWei(amount.toString(), 'ether')),
			data: data
		};
	}

	signTx(rawTx: object, private_key: string): string {
		try {
			const tx = new Tx(rawTx);
			tx.sign(new Buffer(private_key, 'hex'));
			return tx.serialize().toString('hex');
		} catch (err) {
			console.log(err);
			return '';
		}
	}

	subscribeAcceptPriceEvent() {
		const logLink =
			CST.ETHSCAN_API_KOVAN_LINK +
			'module=logs&action=getLogs&fromBlock=' +
			CST.KOVAN_FROM_BLOCK +
			'&toBlock=latest&address=' +
			CST.CUSTODIAN_ADDR +
			'&topic0=' +
			CST.ACCEPT_PRICE_EVENT +
			'&apikey=' +
			CST.ETHSCAN_API_KEY;

		schedule.scheduleJob({ rule: '/2 * * * *' }, async () => {
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
			// console.log(priceInWei);
			// console.log(priceInSeconds);
		});
	}

	async commitSinglePrice(isInception: boolean, gasPrice: number, gasLimit: number) {

		const currentPrice: Price = await calculateor.getPriceFix();
		const priceInWei: number = Number(currentPrice.price) * Math.pow(10, 18);
		const priceInSeconds: number = Math.floor(Number(currentPrice.timestamp) / 1000);
		console.log('ETH price is ' + priceInWei + ' at timestamp ' + priceInSeconds);
		const nonce = await web3.eth.getTransactionCount(CST.PF_ADDR);
		const command = this.generateTxString(
			priceInWei,
			priceInSeconds,
			isInception ? 'startContract' : 'commitPrice'
		);
		// sending out transaction
		web3.eth
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
		let gasLimit = 60000;
		for (let i = 3; i < argv.length; i++) {
			const args = argv[i].split('=');
			switch (args[0]) {
				case 'gasPrice':
					gasPrice = Number(args[1]) || gasPrice;
					break;
				case 'gasLimit':
					gasLimit = Number(args[1]) || gasLimit;
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

		const res = await custodianContract.methods.state().call();
		const isInception = Number(res) === 0;
		if (isInception) {
			// contract is in inception state; start contract first and then commit price
			schedule.scheduleJob({ start: startTime, end: endTime, rule: rule }, () =>
				this.commitSinglePrice(true, gasPrice, gasLimit)
			);
		}

		schedule.scheduleJob({ start: isInception ? commitStart : startTime, rule: rule }, () =>
			this.commitSinglePrice(false, gasPrice, gasLimit)
		);
	}
}

const contractUtil = new ContractUtil();
export default contractUtil;
