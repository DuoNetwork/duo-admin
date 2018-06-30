import dynamoUtil from './database/dynamoUtil';
import sqlUtil from './database/sqlUtil';
import keyUtil from './keyUtil';
import { IOption, IPrice, ITrade } from './types';
import util from './util';
const localSQLauth = require('./keys/mysql.json');

class DbUtil {
	private dynamo: boolean = false;

	public async init(tool: string, option: IOption) {
		this.dynamo = option.dynamo;
		const role = util.getDynamoRole(tool, option.dynamo);
		const process = util.getStatusProcess(tool, option);
		util.log('role: ' + role);
		util.log('process: ' + process);

		dynamoUtil.init(option.live, role, process);
		if ((['bitfinex', 'gemini', 'kraken', 'gdax', 'commit'].includes(tool) && !option.dynamo) || option.server) {
			const sqlAuth = await keyUtil.getSqlAuth(option);
			sqlUtil.init(sqlAuth.host, sqlAuth.user, sqlAuth.password);
		} else
			sqlUtil.init(localSQLauth.host, localSQLauth.user, localSQLauth.password);
	}

	public insertTradeData(trade: ITrade, insertStatus: boolean) {
		return this.dynamo
			? dynamoUtil.insertTradeData(trade, insertStatus)
			: sqlUtil.insertTradeData(trade, insertStatus);
	}

	public insertPrice(price: IPrice) {
		return this.dynamo ? Promise.reject('invalid') : sqlUtil.insertPrice(price);
	}

	public readLastPrice(): Promise<IPrice> {
		return this.dynamo ? Promise.reject('invalid') : sqlUtil.readLastPrice();
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
