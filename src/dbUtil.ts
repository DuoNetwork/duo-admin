import dynamoUtil from './database/dynamoUtil';
import sqlUtil from './database/sqlUtil';
import { IPrice, ITrade } from './types';

export class DbUtil {
	private dynamo: boolean = false;

	public init(useDynamo: boolean) {
		this.dynamo = useDynamo;
	}

	public insertTradeData(needInsertStatus: boolean, sourceData: ITrade) {
		return this.dynamo
			? dynamoUtil.insertTradeData(needInsertStatus, sourceData)
			: sqlUtil.insertTradeData(needInsertStatus, sourceData);
	}

	public insertPrice(price: IPrice) {
		return this.dynamo ? Promise.reject('invalid') : sqlUtil.insertPrice(price);
	}

	public readLastPrice(): Promise<IPrice> {
		return this.dynamo ? Promise.reject('invalid') : sqlUtil.readLastPrice();
	}

	public async readSourceData(currentTimestamp: number): Promise<ITrade[]> {
		return this.dynamo ? Promise.reject('invalid') : sqlUtil.readSourceData(currentTimestamp);
	}
}

const dbUtil = new DbUtil();
export default dbUtil;
