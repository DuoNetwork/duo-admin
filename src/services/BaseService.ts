import DualClassWrapper from '../../../duo-contract-wrapper/src/DualClassWrapper';
import EsplanadeWrapper from '../../../duo-contract-wrapper/src/EsplanadeWrapper';
import MagiWrapper from '../../../duo-contract-wrapper/src/MagiWrapper';
import Web3Wrapper from '../../../duo-contract-wrapper/src/Web3Wrapper';
import { IOption } from '../common/types';
import dbUtil from '../utils/dbUtil';

export default class BaseService {
	public web3Wrapper: Web3Wrapper;
	public tool: string;
	public option: IOption;

	constructor(tool: string, option: IOption) {
		this.option = option;
		this.tool = tool;
		this.web3Wrapper = new Web3Wrapper(null, option.provider, '', option.live);
	}

	public init() {
		return dbUtil.init(this.tool, this.option, this.web3Wrapper);
	}

	public createDuoWrappers(): {[type: string]: {[tenor: string]: DualClassWrapper}} {
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
}
