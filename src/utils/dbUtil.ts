import * as CST from '../common/constants';
import { IOption, IPriceFix, ITrade } from '../common/types';
// import localSQLauth from '../keys/mysql.json';
import dynamoUtil from './dynamoUtil';
import keyUtil from './keyUtil';
import sqlUtil from './sqlUtil';
import util from './util';

class DbUtil {
	private dynamo: boolean = false;

	public async init(tool: string, option: IOption) {
		this.dynamo = option.dynamo;
		const role = util.getDynamoRole(option, tool, option.dynamo);
		const process = util.getStatusProcess(tool, option);
		util.logInfo('role: ' + role);
		util.logInfo('process: ' + process);

		const config = require('../keys/aws/' + (option.live ? 'live' : 'dev') + '/admin.json');
		dynamoUtil.init(config, option.live, process);
		if ([CST.TRADES, CST.COMMIT, CST.CLEAN_DB].includes(tool) && !option.dynamo)
			if (option.server) {
				const sqlAuth = await keyUtil.getSqlAuth(option);
				sqlUtil.init(sqlAuth.host, sqlAuth.user, sqlAuth.password);
			} else {
				const localSQLauth = require('../keys/mysql.json');
				sqlUtil.init(localSQLauth.host, localSQLauth.user, localSQLauth.password);
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

	public readLastPrice(base: string, quote: string): Promise<IPriceFix> {
		return this.dynamo ? Promise.reject('invalid') : sqlUtil.readLastPrice(base, quote);
	}

	public readSourceData(currentTimestamp: number): Promise<ITrade[]> {
		return this.dynamo ? Promise.reject('invalid') : sqlUtil.readSourceData(currentTimestamp);
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
