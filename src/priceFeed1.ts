const Web3 = require('web3');
const rp = require('request-promise');
var Tx = require('ethereumjs-tx');
import { Promise } from 'es6-promise';

// const provider = 'https://mainnet.infura.io/Ky03pelFIxoZdAUsr82w';
const provider = 'https://kovan.infura.io/WSDscoNUvMiL1M7TvMNP ';
// const provider = 'http://localhost:8545';
const web3 = new Web3(new Web3.providers.HttpProvider(provider));

const CustodianABI = require('./ABI/Custodian.json'); //Custodian Contract ABI
const addressCustodianContract = '0x8bf0bee757bbab37a8eb55fa6befb63437a3bb1b';
const custodianContract = new web3.eth.Contract(CustodianABI['abi'], addressCustodianContract);

const pfAddress = '0x0022BFd6AFaD3408A1714fa8F9371ad5Ce8A0F1a';
const privateKey = "5e02a6a6b05fe971309cba0d0bd8f5e85f25e581d18f89eb0b6da753d18aa285";
let gas_price = 100 * Math.pow(10,9);
let gas_limit = 6000000;

const ETH_PRICE_LINK = 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD';
let priceFeedInterval = 60*60*1000; 

class PriceFeed1 {
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

	generateTxStrng(priceInWei: number, priceInSeconds: number): string {
		var res = web3.eth.abi.encodeFunctionCall({
			name: 'commitPrice',
			type: 'function',
			inputs: [
				{
					"name": "priceInWei",
					"type": "uint256"
				},
				{
					"name": "priceInSeconds",
					"type": "uint256"
				}
				]
		}, [priceInWei,priceInSeconds]);
		return res;
	}

	create_tx_command(nonce: number, gas_price: number, gas_limit: number, to_address: string, amount: number, data: string): object {	
		var rawTx = {
		  nonce: nonce,//web3.utils.toHex(nonce), //nonce, 
		  gasPrice: web3.utils.toHex(gas_price), 
		  gasLimit:  web3.utils.toHex(gas_limit), 
		  to: to_address, 
		  value: web3.utils.toHex(web3.utils.toWei(amount.toString())), 
		  data: data
		}
		return rawTx;
	}

	sign_tx(rawTx: object, private_key: string): string {
		try {
		  var tx = new Tx(rawTx);
		  var private_key_hex = new Buffer(private_key, 'hex'); 
		  tx.sign(private_key_hex);
		} catch(err) {
		  console.log(err);
		  return;
		}
		var serializedTx = tx.serialize().toString('hex');
		return serializedTx
	}

	startFeeding() {
		let priceInWei;
		let priceInSeconds;

		let commitFunc = () => {
			this.getETHprice(ETH_PRICE_LINK)
				.then(res => {
					let data = JSON.parse(res);
					priceInWei = data['USD'];
					priceInSeconds = (new Date().getTime() / 1000).toFixed(0);
					// console.log(priceInWei);
					// console.log(priceInSeconds);
				})
				.then(() => {
					console.log('starting committing price');
					web3.eth.getTransactionCount(pfAddress).then(nonce => {
						console.log(nonce);
						let command = this.generateTxStrng(priceInWei, priceInSeconds);
						let rawTx = this.create_tx_command(nonce, gas_price, gas_limit, addressCustodianContract, 0, command);
						let transactionMSG = this.sign_tx(rawTx, privateKey);
						// sending out transaction
						web3.eth.sendSignedTransaction('0x' + transactionMSG).on('receipt', console.log);
					});
				});
		}
		commitFunc();
		setInterval(commitFunc, priceFeedInterval);
	}
}

let pf1 = new PriceFeed1();
export default pf1;
