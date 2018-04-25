const Web3 = require('web3');
import * as CST from '../constant';

// const provider = 'https://mainnet.infura.io/Ky03pelFIxoZdAUsr82w';
const provider = 'https://kovan.infura.io/WSDscoNUvMiL1M7TvMNP ';
const web3 = new Web3(new Web3.providers.HttpProvider(provider));

const CustodianABI = require('../ABI/Custodian.json'); // Custodian Contract ABI
const addressCustodianContract = CST.addressCustodianContract;

const custodianContract = new web3.eth.Contract(CustodianABI['abi'], addressCustodianContract);

export class ContractReader {
	read(name: string) {
		switch (name) {
			case 'lastPrice':
				custodianContract.methods.lastPrice().call().then(res => {
					console.log(res);
				});
				break;

			case 'state':
				custodianContract.methods.state().call().then(res => {
					console.log(res);
				});
				break;
		}
	}
}

const contractRead = new ContractReader();
export default contractRead;
