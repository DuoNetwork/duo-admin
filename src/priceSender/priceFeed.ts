import Web3 from 'web3';
import * as CST from '../constant';
import calculatePrice from '../priceCalculator/priceCalculatorUtil';
const Tx = require('ethereumjs-tx');
const schedule = require('node-schedule');

// const provider = 'https://mainnet.infura.io/Ky03pelFIxoZdAUsr82w';
const provider = 'https://kovan.infura.io/WSDscoNUvMiL1M7TvMNP ';
// const provider = 'http://localhost:8545';
const web3 = new Web3(new Web3.providers.HttpProvider(provider));

// const CustodianABI = require('../ABI/Custodian.json'); // Custodian Contract ABI
const addressCustodianContract = CST.addressCustodianContract;
// const custodianContract: any = new web3.eth.Contract(CustodianABI['abi'], addressCustodianContract);

const pfAddress = CST.pfAddress;
const privateKey = CST.privateKey;

const gas_price = 100 * Math.pow(10, 9);
const gas_limit = 200000;

export class PriceFeed {

	generateTxStrng(priceInWei: number, priceInSeconds: number, name: string): string {
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

	createTxCommand(nonce: number, gas_price: number, gas_limit: number, to_address: string, amount: number, data: string): object {
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

	startFeeding() {
		let priceInWei;
		let priceInSeconds;

		const startTime = new Date(Date.now());
		const endTime = new Date(startTime.getTime() + 298000);
		const commitStart = new Date(endTime.getTime() + 1000);
		const rule = new schedule.RecurrenceRule();
		rule.minute = new schedule.Range(0, 59, 5);

		schedule.scheduleJob({ start: startTime, end: endTime, rule: rule }, () => {
			// priceInSeconds = (new Date().getTime() / 1000).toFixed(0);
			console.log('start contract at ' + priceInSeconds);
			calculatePrice.calculatePrice()
				.then(res => {
					priceInWei = res[0] * Math.pow(10, 9);
					priceInSeconds = Math.floor(res[1] / 1000) * Math.pow(10, 9);
					console.log('ETH price is ' + res[0] + ' at timestamp ' + res[1]);
				})
				.then(() => {
					web3.eth.getTransactionCount(pfAddress).then(nonce => {
						let command;
						// console.log(nonce);
						command = this.generateTxStrng(priceInWei, priceInSeconds, 'startContract');

						// sending out transaction
						web3.eth
							.sendSignedTransaction(
								'0x' +
									this.signTx(this.createTxCommand(nonce, gas_price, gas_limit, addressCustodianContract, 0, command), privateKey)
							)
							.on('receipt', console.log);
					});
				});
		});
		schedule.scheduleJob({ start: commitStart, rule: rule }, () => {
			// priceInSeconds = (new Date().getTime() / 1000).toFixed(0);
			console.log('fetch ETH price at ' + priceInSeconds);
			calculatePrice.calculatePrice()
				.then(res => {
					priceInWei = res[0] * Math.pow(10, 9);
					priceInSeconds = Math.floor(res[1] / 1000) * Math.pow(10, 9);
					console.log('ETH price is ' + res[0] + ' at timestamp ' + res[1]);
				})
				.then(() => {
					web3.eth.getTransactionCount(pfAddress).then(nonce => {
						let command;
						// console.log(nonce);
						command = this.generateTxStrng(priceInWei, priceInSeconds, 'commitPrice');

						// sending out transaction
						web3.eth
							.sendSignedTransaction(
								'0x' +
									this.signTx(this.createTxCommand(nonce, gas_price, gas_limit, addressCustodianContract, 0, command), privateKey)
							)
							.on('receipt', console.log);
					});
				});
		});
	}
}

const pf = new PriceFeed();
export default pf;
