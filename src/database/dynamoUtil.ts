import AWS from 'aws-sdk';
import { PutItemInput } from 'aws-sdk/clients/dynamodb';
import moment from 'moment';
import * as CST from '../constants';
import { IPrice, IPriceBar, ITrade } from '../types';
import util from '../util';

export class DynamoUtil {
	private ddb: undefined | AWS.DynamoDB = undefined;
	// private role: string = '';
	private process: string = 'UNKNOWN';
	private live: boolean = false;
	public init(live: boolean, role: string, process: string) {
		this.live = live;
		this.process = process;
		// this.role = role;
		AWS.config.loadFromPath('./src/keys/aws/' + (live ? 'live' : 'dev') + '/' + role + '.json');
		this.ddb = new AWS.DynamoDB({ apiVersion: CST.AWS_DYNAMO_API_VERSION });
	}

	public insertData(params: PutItemInput): Promise<void> {
		return new Promise(
			(resolve, reject) =>
				this.ddb
					? this.ddb.putItem(params, err => (err ? reject(err) : resolve()))
					: reject('dynamo db connection is not initialized')
		);
	}

	public convertTradeToSchema(trade: ITrade, systime: number) {
		return {
			[CST.DB_TX_ID]: { S: trade.id },
			[CST.DB_TX_PRICE]: { N: trade.price.toString() },
			[CST.DB_TX_AMOUNT]: { N: trade.amount.toString() },
			[CST.DB_TX_TS]: { N: trade.timestamp + '' },
			[CST.DB_TX_SYSTIME]: { N: systime + '' }
		};
	}

	public convertPriceToSchema(price: IPrice) {
		return {
			[CST.DB_HISTORY_PRICE]: { N: price.price + '' },
			[CST.DB_HISTORY_TIMESTAMP]: { N: price.timestamp + '' },
			[CST.DB_HISTORY_VOLUME]: { N: price.volume + '' }
		};
	}

	public convertPriceBarToSchema(priceBar: IPriceBar) {
		return {
			[CST.DB_HR_SRC_DATE]: { S: priceBar.source + '|' + priceBar.date },
			[CST.DB_HR_HOUR]: { N: priceBar.hour + '' },
			[CST.DB_HR_OPEN]: { N: priceBar.open + '' },
			[CST.DB_HR_HIGH]: { N: priceBar.high + '' },
			[CST.DB_HR_LOW]: { N: priceBar.low + '' },
			[CST.DB_HR_CLOSE]: { N: priceBar.close + '' },
			[CST.DB_HR_VOLUME]: { N: priceBar.volume + '' },
			[CST.DB_HR_TS]: { N: priceBar.timestamp + '' }
		};
	}

	public async insertTradeData(trade: ITrade, insertStatus: boolean): Promise<void> {
		const systemTimestamp = util.getNowTimestamp(); // record down the MTS
		const data = this.convertTradeToSchema(trade, systemTimestamp);

		const params = {
			TableName: this.live ? CST.DB_AWS_TRADES_LIVE : CST.DB_AWS_TRADES_DEV,
			Item: {
				[CST.DB_TX_SRC_DATE]: {
					S: trade.source + '|' + moment.utc(trade.timestamp).format('YYYY-MM-DD')
				},
				...data
			}
		};

		await this.insertData(params);
		if (insertStatus) await this.insertStatusData(data);
	}

	public async insertHourlyData(priceBar: IPriceBar): Promise<void> {
		return this.insertData({
			TableName: this.live ? CST.DB_AWS_HOURLY_LIVE : CST.DB_AWS_HOURLY_DEV,
			Item: {
				...this.convertPriceBarToSchema(priceBar)
			}
		});
	}

	public insertHeartbeat(): Promise<void> {
		return this.insertData({
			TableName: this.live ? CST.DB_AWS_STATUS_LIVE : CST.DB_AWS_STATUS_DEV,
			Item: {
				[CST.DB_ST_PROCESS]: {
					S: this.process
				},
				[CST.DB_ST_TS]: { N: util.getNowTimestamp() + '' }
			}
		});
	}

	public insertStatusData(data: object): Promise<void> {
		return this.insertData({
			TableName: this.live ? CST.DB_AWS_STATUS_LIVE : CST.DB_AWS_STATUS_DEV,
			Item: {
				[CST.DB_ST_PROCESS]: {
					S: this.process
				},
				...data
			}
		});
	}

	public readTradeData(source: string, date: string): Promise<any> {
		const params = {
			TableName: this.live ? CST.DB_AWS_TRADES_LIVE : CST.DB_AWS_TRADES_DEV,
			KeyConditionExpression: CST.DB_TX_SRC_DATE + ' = :' + CST.DB_TX_SRC_DATE,
			ExpressionAttributeValues: {
				[':' + CST.DB_TX_SRC_DATE]: { S: source + '|' + date }
			}
		};

		console.log(params);

		return new Promise(
			(resolve, reject) =>
				this.ddb
					? this.ddb.query(params, (err, data) => (err ? reject(err) : resolve(data)))
					: reject('dynamo db connection is not initialized')
		);
	}
}

const dynamoUtil = new DynamoUtil();
export default dynamoUtil;
