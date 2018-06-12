import Web3 from 'web3';
import { Contract } from 'web3/types';
import * as CST from './constants';
import { IOption} from './types';
// import util from './util';

const Tx = require('ethereumjs-tx');

export default class DuoUtil {
	public web3: Web3;
	public abi: any;
	public contract: Contract;
	public publicKey: string = '';
	public privateKey: string = '';

	constructor(option: IOption) {
		this.web3 = new Web3(
			option.source
				? new Web3.providers.HttpProvider(option.provider)
				: new Web3.providers.WebsocketProvider(option.provider)
		);
		this.abi = require('./static/DUO.json');
		this.contract = new this.web3.eth.Contract(this.abi.abi, CST.DUO_CONTRACT_ADDR);

	}
	// transfer(address to, uint value)
}
