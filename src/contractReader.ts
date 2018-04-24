const Web3 = require('web3');

// const provider = 'https://mainnet.infura.io/Ky03pelFIxoZdAUsr82w';
const provider = 'https://kovan.infura.io/WSDscoNUvMiL1M7TvMNP ';
const web3 = new Web3(new Web3.providers.HttpProvider(provider));

const CustodianABI = require('./ABI/Custodian.json'); // Custodian Contract ABI
const addressCustodianContract = '0x8bf0bee757bbab37a8eb55fa6befb63437a3bb1b';

const custodianContract = new web3.eth.Contract(CustodianABI['abi'], addressCustodianContract);

export class ContractReader {
	read(name: string) {
		switch (name) {
			case 'lastPrice':
				custodianContract.methods.lastPrice.call({ from: '0x00D8d0660b243452fC2f996A892D3083A903576F' }).then(res => {
					console.log(res);
				});
				break;
		}
	}
}

const contractRead = new ContractReader();
export default contractRead;
