import Web3 from 'web3';
import * as CST from './constants';
const abiDecoder = require('abi-decoder');

// const provider = 'https://mainnet.infura.io/Ky03pelFIxoZdAUsr82w';
const provider = 'https://kovan.infura.io/WSDscoNUvMiL1M7TvMNP ';
const web3 = new Web3(new Web3.providers.HttpProvider(provider));
const CustodianABI = require('./static/Custodian.json'); // Custodian Contract ABI
const custodianContract = new web3.eth.Contract(CustodianABI['abi'], CST.CUSTODIAN_ADDR);

export class ContractUtil {
	read(name: string) {
		switch (name) {
			case 'lastPrice':
				custodianContract.methods
					.lastPrice()
					.call()
					.then(res => {
						console.log(res);
					});
				break;

			case 'state':
				custodianContract.methods
					.state()
					.call()
					.then(res => {
						console.log(res);
					});
				break;
		}
	}

	decode(input) {
		abiDecoder.addABI(CustodianABI['abi']);

		return abiDecoder.decodeMethod(input);
	}
}

const contractUtil = new ContractUtil();
export default contractUtil;
