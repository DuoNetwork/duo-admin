import AWS from 'aws-sdk';
import { PutItemInput, QueryInput, QueryOutput } from 'aws-sdk/clients/dynamodb';
import moment from 'moment';
import * as CST from '../constants';
import ContractUtil from '../contractUtil';
import { IEvent, IPrice, IPriceBar, ITrade } from '../types';
import util from '../util';

class DynamoUtil {
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

	public queryData(params: QueryInput): Promise<QueryOutput> {
		return new Promise(
			(resolve, reject) =>
				this.ddb
					? this.ddb.query(params, (err, data) => (err ? reject(err) : resolve(data)))
					: reject('dynamo db connection is not initialized')
		);
	}

	public convertTradeToDynamo(trade: ITrade, systime: number) {
		return {
			[CST.DB_TX_ID]: { S: trade.id },
			[CST.DB_TX_PRICE]: { N: trade.price.toString() },
			[CST.DB_TX_AMOUNT]: { N: trade.amount.toString() },
			[CST.DB_TX_TS]: { N: trade.timestamp + '' },
			[CST.DB_TX_SYSTIME]: { N: systime + '' }
		};
	}

	public convertDynamoToTrade(data: object): ITrade {
		return {
			source: data[CST.DB_TX_SRC_DHM].S.split('|')[0],
			id: data[CST.DB_TX_ID].S,
			price: Number(data[CST.DB_TX_PRICE].N),
			amount: Number(data[CST.DB_TX_AMOUNT].N),
			timestamp: Number(data[CST.DB_TX_TS].N)
		};
	}

	public convertPriceToDynamo(price: IPrice) {
		return {
			[CST.DB_HISTORY_PRICE]: { N: price.price + '' },
			[CST.DB_HISTORY_TIMESTAMP]: { N: price.timestamp + '' },
			[CST.DB_HISTORY_VOLUME]: { N: price.volume + '' }
		};
	}

	public convertPriceBarToDynamo(priceBar: IPriceBar) {
		return {
			[CST.DB_OHLC_OPEN]: { N: priceBar.open + '' },
			[CST.DB_OHLC_HIGH]: { N: priceBar.high + '' },
			[CST.DB_OHLC_LOW]: { N: priceBar.low + '' },
			[CST.DB_OHLC_CLOSE]: { N: priceBar.close + '' },
			[CST.DB_OHLC_VOLUME]: { N: priceBar.volume + '' },
			[CST.DB_OHLC_TS]: { N: priceBar.timestamp + '' }
		};
	}

	public convertDynamoToPriceBar(data: object, isMinutely: boolean = true): IPriceBar {
		const sourceDatetime = data[isMinutely ? CST.DB_MN_SRC_DATE_HOUR : CST.DB_HR_SRC_DATE].S;
		const [source, datetime] = sourceDatetime.split('|');
		return {
			source: source,
			date: datetime.substring(0, 10),
			hour: isMinutely ? datetime.substring(11, 13) : data[CST.DB_HR_HOUR].N,
			minute: isMinutely ? Number(data[CST.DB_MN_MINUTE].N) : 0,
			open: Number(data[CST.DB_OHLC_OPEN].N),
			high: Number(data[CST.DB_OHLC_HIGH].N),
			low: Number(data[CST.DB_OHLC_LOW].N),
			close: Number(data[CST.DB_OHLC_CLOSE].N),
			volume: Number(data[CST.DB_OHLC_VOLUME].N),
			timestamp: Number(data[CST.DB_OHLC_TS].N)
		};
	}

	public convertEventToDynamo(event: IEvent, sysTime: number) {
		let addr = '';
		if (
			event.type === CST.EVENT_ACCEPT_PRICE ||
			event.type === CST.EVENT_COMMIT_PRICE ||
			event.type === CST.EVENT_CREATE ||
			event.type === CST.EVENT_REDEEM
		)
			addr = event.parameters['sender'];
		else if (event.type === CST.EVENT_TRANSFER) addr = event.parameters['from'];
		else if (event.type === CST.EVENT_APPROVAL) addr = event.parameters['tokenOwner'];
		const dbInput = {
			[CST.DB_EVENT_KEY]: {
				S:
					event.type +
					'|' +
					moment.utc(event.timestamp * 1000).format('YYYY-MM-DD') +
					(addr ? '|' + addr : '')
			},
			[CST.DB_EVENT_TIMESTAMP_ID]: { S: event.timestamp + '|' + event.id },
			[CST.DB_EVENT_SYSTIME]: { N: sysTime + '' },
			[CST.DB_EVENT_BLOCK_HASH]: { S: event.blockHash },
			[CST.DB_EVENT_BLOCK_NO]: { N: event.blockNumber + '' },
			[CST.DB_EVENT_TX_HASH]: { S: event.transactionHash },
			[CST.DB_EVENT_LOG_STATUS]: { S: event.logStatus }
		};
		for (const key in event.parameters)
			dbInput[key] = {
				S: event.parameters[key]
			};
		return dbInput;
	}

	public async insertTradeData(trade: ITrade, insertStatus: boolean): Promise<void> {
		const systemTimestamp = util.getNowTimestamp(); // record down the MTS
		const data = this.convertTradeToDynamo(trade, systemTimestamp);

		const params = {
			TableName: this.live ? CST.DB_AWS_TRADES_LIVE : CST.DB_AWS_TRADES_DEV,
			Item: {
				[CST.DB_TX_SRC_DHM]: {
					S: trade.source + '|' + moment.utc(trade.timestamp).format('YYYY-MM-DD-HH-mm')
				},
				...data
			}
		};

		await this.insertData(params);
		if (insertStatus) await this.insertStatusData(data);
	}

	public async insertEventData(events: IEvent[]) {
		const systime = util.getNowTimestamp();
		events.forEach(async event => {
			const data = this.convertEventToDynamo(event, systime);
			const params = {
				TableName: this.live ? CST.DB_AWS_EVENTS_LIVE : CST.DB_AWS_EVENTS_DEV,
				Item: {
					...data
				}
			};
			await this.insertData(params);
		});
	}

	public insertMinutelyData(priceBar: IPriceBar): Promise<void> {
		return this.insertData({
			TableName: this.live ? CST.DB_AWS_MINUTELY_LIVE : CST.DB_AWS_MINUTELY_DEV,
			Item: {
				[CST.DB_MN_SRC_DATE_HOUR]: {
					S: priceBar.source + '|' + priceBar.date + '-' + priceBar.hour
				},
				[CST.DB_MN_MINUTE]: { N: Number(priceBar.minute) + '' },
				...this.convertPriceBarToDynamo(priceBar)
			}
		});
	}

	public async insertHourlyData(priceBar: IPriceBar): Promise<void> {
		return this.insertData({
			TableName: this.live ? CST.DB_AWS_HOURLY_LIVE : CST.DB_AWS_HOURLY_DEV,
			Item: {
				[CST.DB_HR_SRC_DATE]: {
					S: priceBar.source + '|' + priceBar.date
				},
				[CST.DB_HR_HOUR]: { N: Number(priceBar.hour) + '' },
				...this.convertPriceBarToDynamo(priceBar)
			}
		});
	}

	public insertHeartbeat(data: object = {}): Promise<void> {
		return this.insertData({
			TableName: this.live ? CST.DB_AWS_STATUS_LIVE : CST.DB_AWS_STATUS_DEV,
			Item: {
				[CST.DB_ST_PROCESS]: {
					S: this.process
				},
				[CST.DB_ST_TS]: { N: util.getNowTimestamp() + '' },
				...data
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

	public async readLastBlock(): Promise<number> {
		const params = {
			TableName: this.live ? CST.DB_AWS_STATUS_LIVE : CST.DB_AWS_STATUS_DEV,
			KeyConditionExpression: CST.DB_ST_PROCESS + ' = :' + CST.DB_ST_PROCESS,
			ExpressionAttributeValues: {
				[':' + CST.DB_ST_PROCESS]: { S: CST.DB_STATUS_EVENT_PUBLIC_OTHERS }
			}
		};

		const data = await this.queryData(params);
		if (!data.Items || !data.Items.length) return 0;
		return Number(data.Items[0].block.N);
	}

	public async readTradeData(source: string, datetimeString: string): Promise<ITrade[]> {
		const params = {
			TableName: this.live ? CST.DB_AWS_TRADES_LIVE : CST.DB_AWS_TRADES_DEV,
			KeyConditionExpression: CST.DB_TX_SRC_DHM + ' = :' + CST.DB_TX_SRC_DHM,
			ExpressionAttributeValues: {
				[':' + CST.DB_TX_SRC_DHM]: { S: source + '|' + datetimeString }
			}
		};

		const data = await this.queryData(params);
		if (!data.Items || !data.Items.length) return [];

		return data.Items.map(d => this.convertDynamoToTrade(d));
	}

	public async readMinutelyData(source: string, datetimeString: string): Promise<IPriceBar[]> {
		const params = {
			TableName: this.live ? CST.DB_AWS_MINUTELY_LIVE : CST.DB_AWS_MINUTELY_DEV,
			KeyConditionExpression: CST.DB_MN_SRC_DATE_HOUR + ' = :' + CST.DB_MN_SRC_DATE_HOUR,
			ExpressionAttributeValues: {
				[':' + CST.DB_MN_SRC_DATE_HOUR]: { S: source + '|' + datetimeString }
			}
		};

		const data = await this.queryData(params);
		if (!data.Items || !data.Items.length) return [];

		return data.Items.map(d => this.convertDynamoToPriceBar(d));
	}
}

const dynamoUtil = new DynamoUtil();
export default dynamoUtil;
