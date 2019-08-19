import {
	Constants,
	Constants as WrapperConstants,
	DualClassWrapper,
	EsplanadeWrapper,
	MagiWrapper,
	StakeWrapper,
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
		const duoWrappers: {
			[type: string]: { [tenor: string]: DualClassWrapper | VivaldiWrapper };
		} = {};
		const custodianAddrs = this.web3Wrapper.contractAddresses.Custodians;
		for (const contractType in custodianAddrs)
			if (!util.isEmptyObject(custodianAddrs[contractType]))
				for (const tenor in custodianAddrs[contractType])
					Object.assign(duoWrappers, {
						[contractType]: {
							[tenor]:
								contractType === WrapperConstants.VIVALDI
									? new VivaldiWrapper(
											this.web3Wrapper,
											this.web3Wrapper.contractAddresses.Custodians[
												contractType
											][tenor].custodian.address
									  )
									: new DualClassWrapper(
											this.web3Wrapper,
											this.web3Wrapper.contractAddresses.Custodians[
												contractType
											][tenor].custodian.address
									  )
						}
					});
		return duoWrappers;
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
		const DualWrappers = [];
		for (const type in duoWrappers)
			for (const tenor in duoWrappers[type]) DualWrappers.push(duoWrappers[type][tenor]);

		eventUtil.trigger(this.address, DualWrappers, this.option.event);
	}

	public async commitPrice() {
		await this.fetchKey();
		const magiWrapper = this.createMagiWrapper();
		priceUtil.startCommitPrices(this.address, magiWrapper, this.option.pair);
		global.setInterval(() => dbUtil.insertHeartbeat(), 30000);
	}

	public async fetchPrice(option: IOption) {
		await this.fetchKey();
		const duoWrappers = this.createDuoWrappers();
		const magiWrapper = this.createMagiWrapper();
		const DualWrappers: DualClassWrapper[] = [];
		if (!option.contractType || !option.tenor) {
			for (const type in duoWrappers)
				if (type !== WrapperConstants.VIVALDI)
					for (const tenor in duoWrappers[type])
						DualWrappers.push(duoWrappers[type][tenor] as DualClassWrapper);
		} else if (!option.tenor && option.contractType && duoWrappers[option.contractType]) {
			if (option.contractType !== WrapperConstants.VIVALDI)
				for (const tenor in duoWrappers[option.contractType])
					DualWrappers.push(duoWrappers[option.contractType][tenor] as DualClassWrapper);
		} else if (option.contractType && option.tenor)
			DualWrappers.push(duoWrappers[option.contractType][option.tenor] as DualClassWrapper);
		else {
			util.logError('please check option contractType and tenor');
			return;
		}

		priceUtil.fetchPrice(this.address, DualWrappers, magiWrapper);
		global.setInterval(() => dbUtil.insertHeartbeat(), 30000);
	}

	public async checkRound(contractWrapper: VivaldiWrapper, magiWrapper: MagiWrapper) {
		await dbUtil.insertHeartbeat();
		const states = await contractWrapper.getStates();
		const magiPrice = await magiWrapper.getLastPrice();
		if (states.lastPriceTime === 0 && states.state === Constants.CTD_TRADING)
			contractWrapper.startRound(this.address);
		else if (util.getUTCNowTimestamp() - states.lastPriceTime > states.period * 1.5)
			return Promise.reject(' option contract has skipped one period!');
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

		return;
	}

	public async round(option: IOption) {
		await this.fetchKey();
		const custodianContract = this.createDuoWrappers();
		const contractWrapper: DualClassWrapper | VivaldiWrapper =
			custodianContract[option.contractType][option.tenor];
		const magiWrapper = this.createMagiWrapper();

		await this.checkRound(contractWrapper as VivaldiWrapper, magiWrapper);
		global.setInterval(
			() => this.checkRound(contractWrapper as VivaldiWrapper, magiWrapper),
			30 * 1000
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
			},
			Mozart: {
				operator: {
					address: 'account',
					privateKey: ''
				}
			},
			Vivaldi: {
				operator: {
					address: 'account',
					privateKey: ''
				}
			}
		};
		try {
			kovanManagerAccount = require(`../static/${
				option.live ? 'live' : 'kovan'
			}ManagerAccount.json`);
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
			!this.web3Wrapper.contractAddresses.Custodians[type] ||
			!this.web3Wrapper.contractAddresses.Custodians[type][tenor]
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
		const duoWrappers = this.createDuoWrappers();
		const magiWrapper = this.createMagiWrapper();
		const esplanadeWrapper = this.createEsplanadeWrapper();

		const StakeWrappers = [];

		for (const stake of this.web3Wrapper.contractAddresses.Stakes) {
			StakeWrappers.push(new StakeWrapper(this.web3Wrapper, stake.address));
		}

		for (const stake of this.web3Wrapper.contractAddresses.StakesV2) {
			StakeWrappers.push(new StakeWrapper(this.web3Wrapper, stake.address));
		}

		const DualWrappers = [];
		for (const type in duoWrappers)
			for (const tenor in duoWrappers[type]) DualWrappers.push(duoWrappers[type][tenor]);
		eventUtil.fetch(
			[magiWrapper, esplanadeWrapper, ...DualWrappers, ...StakeWrappers],
			this.option.force
		);
	}
}
