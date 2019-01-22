import Web3Wrapper from '../../../duo-contract-wrapper/src/Web3Wrapper';
import * as CST from '../common/constants';
import { IOption, IPriceFix, ITrade } from '../common/types';
import dynamoUtil from './dynamoUtil';
import keyUtil from './keyUtil';
import sqlUtil from './sqlUtil';
import util from './util';

class DbUtil {
	public dynamo: boolean = false;

	public async init(tool: string, option: IOption, web3Wrapper: Web3Wrapper) {
		this.dynamo = option.dynamo;
		const process = util.getStatusProcess(tool, option);
		util.logInfo('process: ' + process);

		let config = {};
		try {
			config = require('../keys/aws/' + (option.live ? 'live' : 'dev') + '/admin.json');
		} catch (error) {
			util.logError(error);
		}
		await dynamoUtil.init(
			config,
			option.live,
			process,
			(value: string | number) => web3Wrapper.fromWei(value),
			async txHash => {
				const txReceipt = await web3Wrapper.getTransactionReceipt(txHash);
				if (!txReceipt) return null;
				return {
					status: txReceipt.status
				};
			}
		);
		if ([CST.TRADES, CST.COMMIT, CST.CLEAN_DB].includes(tool) && !option.dynamo) {
			const sqlAuth = await keyUtil.getSqlAuth(option);
			return sqlUtil.init(sqlAuth.host, sqlAuth.user, sqlAuth.password);
		}
	}

	public insertTradeData(trade: ITrade, insertStatus: boolean) {
		return this.dynamo
			? dynamoUtil.insertTradeData(trade, insertStatus)
			: sqlUtil.insertTradeData(trade, insertStatus);
	}

	public insertPrice(price: IPriceFix) {
		return this.dynamo ? Promise.reject('invalid') : sqlUtil.insertPrice(price);
	}

	public readLastPrice(quote: string, base: string): Promise<IPriceFix> {
		return this.dynamo ? Promise.reject('invalid') : sqlUtil.readLastPrice(quote, base);
	}

	public readSourceData(
		currentTimestamp: number,
		quote: string,
		base: string
	): Promise<ITrade[]> {
		return this.dynamo
			? Promise.reject('invalid')
			: sqlUtil.readSourceData(currentTimestamp, base, quote);
	}

	public cleanDB(): Promise<void> {
		return this.dynamo ? Promise.reject() : sqlUtil.cleanDB();
	}

	public insertHeartbeat(data: object = {}): Promise<void> {
		return dynamoUtil.insertHeartbeat(data);
	}
}

const dbUtil = new DbUtil();
export default dbUtil;
