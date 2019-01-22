import DualClassWrapper from '../../../duo-contract-wrapper/src/DualClassWrapper';
import Web3Wrapper from '../../../duo-contract-wrapper/src/Web3Wrapper';
import * as CST from '../common/constants';
import { IOption } from '../common/types';
import dbUtil from '../utils/dbUtil';
import eventUtil from '../utils/eventUtil';
import keyUtil from '../utils/keyUtil';
import priceUtil from '../utils/priceUtil';
import util from '../utils/util';
import BaseService from './BaseService';

export default class ContractService extends BaseService {
	public key: string = '';
	public address: string = '';
	constructor(tool: string, option: IOption) {
		super(tool, option);
	}

	public async fetchKey() {
		this.key = (await keyUtil.getKey(this.tool, this.option)).privateKey;
		this.web3Wrapper = new Web3Wrapper(null, this.option.provider, this.key, this.option.live);
		this.address = this.web3Wrapper.web3.eth.accounts.privateKeyToAccount(
			this.key.startsWith('0x') ? this.key : '0x' + this.key
		).address;
		util.logInfo('loaded key for ' + this.address);
	}

	public async trigger() {
		await this.fetchKey();
		const dualClassCustodianWrappers = this.createDuoWrappers();

		eventUtil.trigger(
			[
				dualClassCustodianWrappers.Beethoven.Perpetual,
				dualClassCustodianWrappers.Beethoven.M19,
				dualClassCustodianWrappers.Mozart.Perpetual,
				dualClassCustodianWrappers.Mozart.M19
			],
			this.option.event
		);
	}

	public async commitPrice() {
		await this.fetchKey();

		await dbUtil.init(this.tool, this.option, this.web3Wrapper);
		const magiWrapper = this.createMagiWrapper();

		priceUtil.startCommitPrices(
			this.address,
			magiWrapper,
			this.option.pair,
			this.option.gasPrice
		);
		global.setInterval(() => dbUtil.insertHeartbeat(), 30000);
	}

	public async fetchPrice() {
		await this.fetchKey();

		await dbUtil.init(this.tool, this.option, this.web3Wrapper);
		const dualClassCustodianWrappers = this.createDuoWrappers();
		const magiWrapper = this.createMagiWrapper();
		priceUtil.fetchPrice(
			this.address,
			[
				dualClassCustodianWrappers.Beethoven.Perpetual,
				dualClassCustodianWrappers.Beethoven.M19,
				dualClassCustodianWrappers.Mozart.Perpetual,
				dualClassCustodianWrappers.Mozart.M19
			],
			magiWrapper,
			this.option.gasPrice
		);
		setInterval(() => dbUtil.insertHeartbeat(), 30000);
	}

	public async startCustodian(account: string) {
		const type = this.option.contractType;
		const tenor = this.option.tenor;
		if (
			![CST.BEETHOVEN, CST.MOZART].includes(type) ||
			![CST.TENOR_PPT, CST.TENOR_M19].includes(tenor)
		) {
			util.logDebug('no contract type or tenor specified');
			return;
		}
		const dualClassCustodianWrappers = this.createDuoWrappers();
		const contractWrapper: DualClassWrapper = dualClassCustodianWrappers[type][tenor];

		contractWrapper.startCustodian(
			account,
			contractWrapper.web3Wrapper.contractAddresses.Custodians[type][tenor].aToken.address,
			contractWrapper.web3Wrapper.contractAddresses.Custodians[type][tenor].bToken.address,
			contractWrapper.web3Wrapper.contractAddresses.Oracles[0].address,
			{
				gasPrice: this.option.gasPrice,
				gasLimit: this.option.gasLimit
			}
		);
	}

	public fetchEvent() {
		const dualClassCustodianWrappers = this.createDuoWrappers();
		const magiWrapper = this.createMagiWrapper();
		const esplanadeWrapper = this.createEsplanadeWrapper();
		eventUtil.fetch(
			[
				dualClassCustodianWrappers.Beethoven.Perpetual,
				dualClassCustodianWrappers.Beethoven.M19,
				dualClassCustodianWrappers.Mozart.Perpetual,
				dualClassCustodianWrappers.Mozart.M19,
				magiWrapper,
				esplanadeWrapper
			],
			this.option.force
		);
	}
}
