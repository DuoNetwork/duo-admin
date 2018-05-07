import Web3 from 'web3';
import * as CST from './constants';
// const provider = 'https://mainnet.infura.io/Ky03pelFIxoZdAUsr82w';
// const provider = 'ws://kovan.infura.io/WSDscoNUvMiL1M7TvMNP';
const provider = 'ws://localhost:8546';
const web3 = new Web3(new Web3.providers.WebsocketProvider(provider));
const CustodianABI = require('./static/Custodian.json'); // Custodian Contract ABI
const custodianContract = new web3.eth.Contract(CustodianABI['abi'], CST.CUSTODIAN_ADDR);
const INCEPTION_BLK = 7171376;

export class EventUtil {
	subscribeToAcceptPrice() {
		console.log('starting listening acceptPrice event');
		custodianContract.events.AcceptPrice(
			{
				fromBlock: INCEPTION_BLK
			},
			function(error, event) {
				if (error) {
					console.log(error);
				} else {
					console.log(event);
				}
			}
		);
	}
}

const eventUtil = new EventUtil();
export default eventUtil;
