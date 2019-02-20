import {
	Constants,
	Constants as WrapperConstants,
	DualClassWrapper,
	EsplanadeWrapper,
	MagiWrapper,
	VivaldiWrapper,
	Web3Wrapper
} from '@finbook/duo-contract-wrapper';
import { IOption } from '../common/types';
import dbUtil from '../utils/dbUtil';
import eventUtil from '../utils/eventUtil';
import keyUtil from '../utils/keyUtil';
import priceUtil from '../utils/priceUtil';
import util from '../utils/util';

export default class ContractService {
	public web3Wrapper: Web3Wrapper;
	public tool: string;
	public option: IOption;
	public key: string = '';
	public address: string = '';

	constructor(tool: string, option: IOption) {
		this.option = option;
		this.tool = tool;
		this.web3Wrapper = new Web3Wrapper(null, option.provider, '', option.live);
	}

	public createDuoWrappers(): {
		[type: string]: { [tenor: string]: DualClassWrapper | VivaldiWrapper };
	} {
		return {
			Beethoven: {
				Perpetual: new DualClassWrapper(
					this.web3Wrapper,
					this.web3Wrapper.contractAddresses.Custodians.Beethoven.Perpetual.custodian.address
				),
				M19: new DualClassWrapper(
					this.web3Wrapper,
					this.web3Wrapper.contractAddresses.Custodians.Beethoven.M19.custodian.address
				)
			},
			Mozart: {
				Perpetual: new DualClassWrapper(
					this.web3Wrapper,
					this.web3Wrapper.contractAddresses.Custodians.Mozart.Perpetual.custodian.address
				),
				M19: new DualClassWrapper(
					this.web3Wrapper,
					this.web3Wrapper.contractAddresses.Custodians.Mozart.M19.custodian.address
				)
			},
			Vivaldi: {
				'100C-3H': new VivaldiWrapper(
					this.web3Wrapper,
					this.web3Wrapper.contractAddresses.Custodians.Vivaldi[
						'100C-3H'
					].custodian.address
				)
			}
		};
	}

	public createMagiWrapper() {
		return new MagiWrapper(
			this.web3Wrapper,
			this.web3Wrapper.contractAddresses.Oracles[0].address
		);
	}

	public createEsplanadeWrapper() {
		return new EsplanadeWrapper(
			this.web3Wrapper,
			this.web3Wrapper.contractAddresses.MultiSigManagers[0].address
		);
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
		const duoWrappers = this.createDuoWrappers();

		eventUtil.trigger(
			this.address,
			[
				duoWrappers.Beethoven.Perpetual as DualClassWrapper,
				duoWrappers.Beethoven.M19 as DualClassWrapper,
				duoWrappers.Mozart.Perpetual as DualClassWrapper,
				duoWrappers.Mozart.M19 as DualClassWrapper,
				duoWrappers.Vivaldi['100C-3H'] as VivaldiWrapper
			],
			this.option.event
		);
	}

	public async commitPrice() {
		await this.fetchKey();
		const magiWrapper = this.createMagiWrapper();
		priceUtil.startCommitPrices(this.address, magiWrapper, this.option.pair);
		global.setInterval(() => dbUtil.insertHeartbeat(), 30000);
	}

	public async fetchPrice() {
		await this.fetchKey();
		const dualClassCustodianWrappers = this.createDuoWrappers();
		const magiWrapper = this.createMagiWrapper();
		priceUtil.fetchPrice(
			this.address,
			[
				dualClassCustodianWrappers.Beethoven.Perpetual as DualClassWrapper,
				dualClassCustodianWrappers.Beethoven.M19 as DualClassWrapper,
				dualClassCustodianWrappers.Mozart.Perpetual as DualClassWrapper,
				dualClassCustodianWrappers.Mozart.M19 as DualClassWrapper
			],
			magiWrapper
		);
		setInterval(() => dbUtil.insertHeartbeat(), 30000);
	}

	public async checkRound(contractWrapper: VivaldiWrapper, magiWrapper: MagiWrapper) {
		const states = await contractWrapper.getStates();
		const magiPrice = await magiWrapper.getLastPrice();
		if (util.getUTCNowTimestamp() - states.lastPriceTime > states.period)
			throw new Error(' option contract has skipped one period!');
		else if (states.state !== Constants.CTD_TRADING) {
			util.logDebug('contract not in trading state!');
			return;
		} else if (states.lastPriceTime < states.resetPriceTime)
			if (states.priceFetchCoolDown === 0) contractWrapper.startRound(this.address);
			else {
				const requiredTime = states.resetPriceTime + states.priceFetchCoolDown;

				if (
					util.getUTCNowTimestamp() > requiredTime &&
					magiPrice.timestamp > requiredTime &&
					magiPrice.price > 0
				)
					contractWrapper.startRound(this.address);
			}
		else if (states.lastPriceTime >= states.resetPriceTime) {
			const miniMumTime = states.resetPriceTime + states.period;
			if (
				util.getUTCNowTimestamp() >= miniMumTime &&
				magiPrice.timestamp === miniMumTime &&
				magiPrice.price > 0
			)
				contractWrapper.endRound(this.address);
		}

	}

	public async round(option: IOption) {
		await this.fetchKey();
		const custodianContract = this.createDuoWrappers();
		const contractWrapper: DualClassWrapper | VivaldiWrapper =
			custodianContract[option.contractType][option.tenor];
		const magiWrapper = this.createMagiWrapper();

		await this.checkRound(contractWrapper as VivaldiWrapper, magiWrapper);
		setInterval(
			() => this.checkRound(contractWrapper as VivaldiWrapper, magiWrapper),
			60 * 1000
		);
	}

	public async startCustodian(option: IOption) {
		let kovanManagerAccount: {
			[type: string]: { operator: { privateKey: string; address: string } };
		} = {
			Beethoven: {
				operator: {
					address: 'account',
					privateKey: ''
				}
			}
		};
		try {
			kovanManagerAccount = require('../static/kovanManagerAccount.json');
		} catch (error) {
			console.log(error);
		}
		this.web3Wrapper = new Web3Wrapper(
			null,
			this.option.provider,
			kovanManagerAccount[option.contractType].operator.privateKey,
			this.option.live
		);
		const account = kovanManagerAccount.Beethoven.operator.address;
		const type = this.option.contractType;
		const tenor = this.option.tenor;
		if (
			![
				WrapperConstants.BEETHOVEN,
				WrapperConstants.MOZART,
				WrapperConstants.VIVALDI
			].includes(type) ||
			![WrapperConstants.TENOR_PPT, WrapperConstants.TENOR_M19, '100C-3H'].includes(tenor)
		) {
			util.logDebug('no contract type or tenor specified');
			return;
		}
		const custodianContract = this.createDuoWrappers();
		const contractWrapper: DualClassWrapper | VivaldiWrapper = custodianContract[type][tenor];
		if (option.contractType === WrapperConstants.VIVALDI) {
			util.logInfo(`start custodian of vivaldi`);
			(contractWrapper as VivaldiWrapper).startCustodian(
				account,
				contractWrapper.web3Wrapper.contractAddresses.Custodians[type][tenor].aToken
					.address,
				contractWrapper.web3Wrapper.contractAddresses.Custodians[type][tenor].bToken
					.address,
				contractWrapper.web3Wrapper.contractAddresses.Oracles[0].address,
				1.0,
				true,
				true
			);
		} else
			(contractWrapper as DualClassWrapper).startCustodian(
				account,
				contractWrapper.web3Wrapper.contractAddresses.Custodians[type][tenor].aToken
					.address,
				contractWrapper.web3Wrapper.contractAddresses.Custodians[type][tenor].bToken
					.address,
				contractWrapper.web3Wrapper.contractAddresses.Oracles[0].address
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
