const Web3 = require('web3');
const rp = require('request-promise');
var Tx = require('ethereumjs-tx');
import { Promise } from 'es6-promise';
import * as CST from '../constant';

// const provider = 'https://mainnet.infura.io/Ky03pelFIxoZdAUsr82w';
const provider = 'https://kovan.infura.io/WSDscoNUvMiL1M7TvMNP ';
// const provider = 'http://localhost:8545';
const web3 = new Web3(new Web3.providers.HttpProvider(provider));

// const CustodianABI = require('./ABI/Custodian.json'); //Custodian Contract ABI
const addressCustodianContract = CST.addressCustodianContract;
// const custodianContract = new web3.eth.Contract(CustodianABI['abi'], addressCustodianContract);

const pfAddress = CST.pfAddress;
const privateKey = CST.privateKey;

let gas_price = 100 * Math.pow(10, 9);
let gas_limit = 80000;

const ETH_PRICE_LINK = CST.ETH_PRICE_LINK;
// let priceFeedInterval = 60 * 60 * 1000;

export class PriceFeed {
	getETHprice(url: string): Promise<string> {
		return new Promise((resolve, reject) =>
			rp(
				{
					url: url,
					headers: {
						'user-agent': 'node.js'
					}
				},
				(error, res, body) => {
					if (error) reject(error);
					else if (res.statusCode === 200) resolve(body);
					else reject('Error status ' + res.statusCode + ' ' + res.statusMessage);
				}
			)
		);
	}

	generateTxStrng(priceInWei: number, priceInSeconds: number, name: string): string {
		var res = web3.eth.abi.encodeFunctionCall(
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
		return res;
	}

	create_tx_command(nonce: number, gas_price: number, gas_limit: number, to_address: string, amount: number, data: string): object {
		var rawTx = {
			nonce: nonce, //web3.utils.toHex(nonce), //nonce,
			gasPrice: web3.utils.toHex(gas_price),
			gasLimit: web3.utils.toHex(gas_limit),
			to: to_address,
			value: web3.utils.toHex(web3.utils.toWei(amount.toString())),
			data: data
		};
		return rawTx;
	}

	sign_tx(rawTx: object, private_key: string): string {
		try {
			var tx = new Tx(rawTx);
			var private_key_hex = new Buffer(private_key, 'hex');
			tx.sign(private_key_hex);
		} catch (err) {
			console.log(err);
			return '';
		}
		var serializedTx = tx.serialize().toString('hex');
		return serializedTx;
	}

	startFeeding() {
		let priceInWei;
		let priceInSeconds;

		let startContract = () => {
			priceInSeconds = (new Date().getTime() / 1000).toFixed(0);
			console.log("start contract at "+priceInSeconds);
			this.getETHprice(ETH_PRICE_LINK)
				.then(res => {
					let data = JSON.parse(res);
					priceInWei = data['USD'] * Math.pow(10, 9);
					
					// console.log(priceInWei);
					// console.log(priceInSeconds);
				})
				.then(() => {
					web3.eth.getTransactionCount(pfAddress).then(nonce => {
						let command;
						// console.log(nonce);
						command = this.generateTxStrng(priceInWei, priceInSeconds, 'startContract');

						let rawTx = this.create_tx_command(nonce, gas_price, gas_limit, addressCustodianContract, 0, command);
						let transactionMSG = this.sign_tx(rawTx, privateKey);
						// sending out transaction
						web3.eth.sendSignedTransaction('0x' + transactionMSG).on('receipt', console.log);
					});
				});
		};

		let commitFunc = () => {
			priceInSeconds = (new Date().getTime() / 1000).toFixed(0);
			console.log("fetch ETH price at "+priceInSeconds);
			this.getETHprice(ETH_PRICE_LINK)
				.then(res => {
					let data = JSON.parse(res);
					priceInWei = data['USD'] * Math.pow(10, 9);
					
					// console.log(priceInWei);
					// console.log(priceInSeconds);
				})
				.then(() => {
					web3.eth.getTransactionCount(pfAddress).then(nonce => {
						let command;
						console.log(nonce);
						command = this.generateTxStrng(priceInWei, priceInSeconds, 'commitPrice');

						let rawTx = this.create_tx_command(nonce, gas_price, gas_limit, addressCustodianContract, 0, command);
						let transactionMSG = this.sign_tx(rawTx, privateKey);
						// sending out transaction
						web3.eth.sendSignedTransaction('0x' + transactionMSG).on('receipt', console.log);
					});
				});
		};
		
		var schedule = require('node-schedule');
	
		let startTime = new Date(Date.now());
		// startTime.setMinutes(59);
		// startTime.setSeconds(0);
		// startTime.setMilliseconds(0);
		let endTime = new Date(startTime.getTime() + 298000);

		let commitStart = new Date(endTime.getTime() + 1000);

		let rule = new schedule.RecurrenceRule();

		rule.minute = new schedule.Range(0, 59, 5);

		schedule.scheduleJob({ start: startTime, end: endTime, rule: rule }, startContract);
		schedule.scheduleJob({ start: commitStart, rule: rule}, commitFunc);
	}
}

const pf = new PriceFeed();
export default pf;
