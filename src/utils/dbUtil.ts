import { IEvent } from '@finbook/duo-contract-wrapper';
import { DynamoUtil, IPrice, IPriceFix, ITrade } from '@finbook/duo-market-data';
import * as CST from '../common/constants';
import { IOption } from '../common/types';
import keyUtil from './keyUtil';
import SqlUtil from './sqlUtil';
import util from './util';

class DbUtil {
	public dynamo: boolean = false;
	public dynamoUtil: DynamoUtil | null = null;
	public sqlUtil: SqlUtil | null = null;

	public async init(tool: string, option: IOption) {
		this.dynamo = option.dynamo;
		const process = util.getStatusProcess(tool, option);
		util.logInfo('process: ' + process);

		let config = {};
		try {
			config = require('../keys/aws/' + (option.live ? 'live' : 'dev') + '/admin.json');
		} catch (error) {
			util.logError(error);
		}
		this.dynamoUtil = new DynamoUtil(config, option.live, process);
		if ([CST.TRADES, CST.COMMIT, CST.CLEAN_DB].includes(tool) && !option.dynamo) {
			const sqlAuth = await keyUtil.getSqlAuth(option);
			this.sqlUtil = new SqlUtil(
				sqlAuth.host,
				sqlAuth.user,
				sqlAuth.password,
				this.dynamoUtil
			);
			return this.sqlUtil.init();
		}
	}

	public insertTradeData(trade: ITrade, insertStatus: boolean) {
		return this.dynamo && this.dynamoUtil
			? this.dynamoUtil.insertTradeData(trade, insertStatus)
			: this.sqlUtil
			? this.sqlUtil.insertTradeData(trade, insertStatus)
			: Promise.reject('invalid');
	}

	public insertPrice(price: IPriceFix) {
		return this.dynamo || !this.sqlUtil
			? Promise.reject('invalid')
			: this.sqlUtil.insertPrice(price);
	}

	public readLastPrice(quote: string, base: string): Promise<IPriceFix> {
		return this.dynamo || !this.sqlUtil
			? Promise.reject('invalid')
			: this.sqlUtil.readLastPrice(quote, base);
	}

	public readSourceData(
		currentTimestamp: number,
		quote: string,
		base: string
	): Promise<ITrade[]> {
		return this.dynamo || !this.sqlUtil
			? Promise.reject('invalid')
			: this.sqlUtil.readSourceData(currentTimestamp, base, quote);
	}

	public cleanDB(): Promise<void> {
		return this.dynamo || !this.sqlUtil ? Promise.reject('invalid') : this.sqlUtil.cleanDB();
	}

	public insertHeartbeat(data: object = {}): Promise<void> {
		return !this.dynamoUtil ? Promise.reject('invalid') : this.dynamoUtil.insertHeartbeat(data);
	}

	public getPrices(src: string, period: number, start: number, end?: number, pair?: string) {
		return !this.dynamo || !this.dynamoUtil
			? Promise.reject('invalid')
			: this.dynamoUtil.getPrices(src, period, start, end, pair);
	}

	public addPrice(price: IPrice) {
		return !this.dynamo || !this.dynamoUtil
			? Promise.reject('invalid')
			: this.dynamoUtil.addPrice(price);
	}

	public readLastBlock() {
		return !this.dynamo || !this.dynamoUtil
			? Promise.reject('invalid')
			: this.dynamoUtil.readLastBlock();
	}

	public insertEventsData(events: IEvent[]) {
		return !this.dynamo || !this.dynamoUtil
			? Promise.reject('invalid')
			: this.dynamoUtil.insertEventsData(events);
	}
}

const dbUtil = new DbUtil();
export default dbUtil;
