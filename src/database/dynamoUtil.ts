import AWS from 'aws-sdk';
import {
	AttributeMap,
	BatchWriteItemInput,
	BatchWriteItemOutput,
	PutItemInput,
	QueryInput,
	QueryOutput
} from 'aws-sdk/clients/dynamodb';
import moment from 'moment';
import * as CST from '../constants';
import { IEvent, IPrice, IPriceBar, ITrade } from '../types';
import util from '../util';

class DynamoUtil {
	private ddb: undefined | AWS.DynamoDB = undefined;
	// private role: string = '';
	private process: string = 'UNKNOWN';
	private live: boolean = false;
	public init(live: boolean, process: string) {
		this.live = live;
		this.process = process;
		// this.role = role;
		AWS.config.loadFromPath('./src/keys/aws/' + (live ? 'live' : 'dev') + '/admin.json');
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

	public batchInsertData(params: BatchWriteItemInput): Promise<BatchWriteItemOutput> {
		return new Promise(
			(resolve, reject) =>
				this.ddb
					? this.ddb.batchWriteItem(
							params,
							(err, data) => (err ? reject(err) : resolve(data))
					)
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
			[CST.DB_TX_QUOTE_BASE_ID]: { S: `${trade.quote}|${trade.base}|${trade.id}` },
			[CST.DB_TX_PRICE]: { N: trade.price.toString() },
			[CST.DB_TX_AMOUNT]: { N: trade.amount.toString() },
			[CST.DB_TX_TS]: { N: trade.timestamp + '' },
			[CST.DB_TX_SYSTIME]: { N: systime + '' }
		};
	}

	public convertDynamoToTrade(data: AttributeMap): ITrade {
		const quoteBaseId = data[CST.DB_TX_QUOTE_BASE_ID].S || '';
		const [base, quote, id] = quoteBaseId.split('|');
		return {
			base: base,
			quote: quote,
			id: id,
			source: (data[CST.DB_TX_SRC_DHM].S || '').split('|')[0],
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

	// public convertDynamoToPriceBar(data: AttributeMap): IPriceBar {
	// 	const sourceDatetime = data[CST.DB_MN_SRC_DATE_HOUR].S || '';
	// 	const [source, datetime] = sourceDatetime.split('|');
	// 	return {
	// 		source: source,
	// 		date: datetime.substring(0, 10),
	// 		hour: datetime.substring(11, 13),
	// 		minute: Number(data[CST.DB_MN_MINUTE].N),
	// 		open: Number(data[CST.DB_OHLC_OPEN].N),
	// 		high: Number(data[CST.DB_OHLC_HIGH].N),
	// 		low: Number(data[CST.DB_OHLC_LOW].N),
	// 		close: Number(data[CST.DB_OHLC_CLOSE].N),
	// 		volume: Number(data[CST.DB_OHLC_VOLUME].N),
	// 		timestamp: Number(data[CST.DB_OHLC_TS].N)
	// 	};
	// }

	public convertEventToDynamo(event: IEvent, sysTime: number) {
		let addr = '';
		if (event.type === CST.EVENT_CREATE || event.type === CST.EVENT_REDEEM)
			addr = event.parameters['sender'];
		else if (event.type === CST.EVENT_TRANSFER) addr = event.parameters['from'];
		else if (event.type === CST.EVENT_APPROVAL) addr = event.parameters['tokenOwner'];
		const dbInput: AttributeMap = {
			[CST.DB_EV_KEY]: {
				S:
					event.type +
					'|' +
					moment
						.utc(event.timestamp)
						.format(
							event.type === CST.EVENT_TOTAL_SUPPLY ? 'YYYY-MM-HH' : 'YYYY-MM-DD'
						) +
					(addr ? '|' + addr : '')
			},
			[CST.DB_EV_TIMESTAMP_ID]: { S: event.timestamp + '|' + event.id },
			[CST.DB_EV_SYSTIME]: { N: sysTime + '' },
			[CST.DB_EV_BLOCK_HASH]: { S: event.blockHash },
			[CST.DB_EV_BLOCK_NO]: { N: event.blockNumber + '' },
			[CST.DB_EV_TX_HASH]: { S: event.transactionHash },
			[CST.DB_EV_LOG_STATUS]: { S: event.logStatus }
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

		console.log(params.TableName, params.Item[CST.DB_TX_SRC_DHM]);

		await this.insertData(params);
		if (insertStatus) await this.insertStatusData(data);
	}

	public async insertEventsData(events: IEvent[]) {
		const systime = util.getNowTimestamp();
		const TableName = this.live ? CST.DB_AWS_EVENTS_LIVE : CST.DB_AWS_EVENTS_DEV;
		// const putItem: any;

		events.forEach(async event => {
			const data = this.convertEventToDynamo(event, systime);
			const params = {
				TableName: TableName,
				Item: {
					...data
				}
			};

			await this.insertData(params);
		});
	}

	// public async batchInsertEventData(events: IEvent[]) {
	// 	const systime = util.getNowTimestamp();
	// 	const TableName = this.live ? CST.DB_AWS_EVENTS_LIVE : CST.DB_AWS_EVENTS_DEV;
	// 	const putItems: any[] = [];
	// 	events.forEach(async event => {
	// 		putItems.push({
	// 			PutRequest: {
	// 				Item: {
	// 					...this.convertEventToDynamo(event, systime)
	// 				}
	// 			}
	// 		});
	// 	});

	// 	const params = {
	// 		RequestItems: {
	// 			[TableName]: putItems
	// 		}
	// 	};
	// 	console.logInfo(JSON.stringify(params, null, 4));
	// 	let data = await this.batchInsertData(params);
	// 	while (data.UnprocessedItems && !util.isEmptyObject(data.UnprocessedItems) && data.UnprocessedItems.length)
	// 		data = await this.batchInsertData({
	// 			RequestItems: data.UnprocessedItems
	// 		});
	// 	console.logInfo('done');
	// }

	// public insertMinutelyData(priceBar: IPriceBar): Promise<void> {
	// 	return this.insertData({
	// 		TableName: this.live ? CST.DB_AWS_MINUTELY_LIVE : CST.DB_AWS_MINUTELY_DEV,
	// 		Item: {
	// 			[CST.DB_MN_SRC_DATE_HOUR]: {
	// 				S: priceBar.source + '|' + priceBar.date + '-' + priceBar.hour
	// 			},
	// 			[CST.DB_MN_MINUTE]: { N: Number(priceBar.minute) + '' },
	// 			...this.convertPriceBarToDynamo(priceBar)
	// 		}
	// 	});
	// }

	public getPriceKeyField(period: number) {
		if (period === 0) return CST.DB_SRC_DHM;
		else if (period === 1) return CST.DB_MN_SRC_DATE_HOUR;
		else throw new Error('invalid period');
	}

	// public async insertHourlyData(priceBar: IPriceBar): Promise<void> {
	// 	return this.insertData({
	// 		TableName: this.live ? CST.DB_AWS_HOURLY_LIVE : CST.DB_AWS_HOURLY_DEV,
	// 		Item: {
	// 			[CST.DB_HR_SRC_DATE]: {
	// 				S: priceBar.source + '|' + priceBar.date
	// 			},
	// 			[CST.DB_HR_HOUR]: { N: Number(priceBar.hour) + '' },
	// 			...this.convertPriceBarToDynamo(priceBar)
	// 		}
	// 	});
	// }

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
		}).catch(error => util.logInfo('Error insert heartbeat: ' + error));
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
		}).catch(error => util.logInfo('Error insert status: ' + error));
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
		// console.logInfo(JSON.stringify(data, null, 4));
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

	// public async readMinutelyData(source: string, datetimeString: string): Promise<IPriceBar[]> {
	// 	const params = {
	// 		TableName: this.live ? CST.DB_AWS_MINUTELY_LIVE : CST.DB_AWS_MINUTELY_DEV,
	// 		KeyConditionExpression: CST.DB_MN_SRC_DATE_HOUR + ' = :' + CST.DB_MN_SRC_DATE_HOUR,
	// 		ExpressionAttributeValues: {
	// 			[':' + CST.DB_MN_SRC_DATE_HOUR]: { S: source + '|' + datetimeString }
	// 		}
	// 	};

	// 	const data = await this.queryData(params);
	// 	if (!data.Items || !data.Items.length) return [];

	// 	return data.Items.map(d => this.convertDynamoToPriceBar(d));
	// }

	public async getSingleKeyPeriodPrices(
		src: string,
		period: number,
		timestamp: number,
		pair: string = ''
	) {
		let params: QueryInput;
		if (period === 0) {
			params = {
				TableName: `${CST.DB_DUO}.${CST.DB_TRADES}.${this.live ? CST.DB_LIVE : CST.DB_DEV}`,
				KeyConditionExpression: `${CST.DB_SRC_DHM} = :${CST.DB_SRC_DHM}`,
				ExpressionAttributeValues: {
					[':' + CST.DB_SRC_DHM]: {
						S: `${src}|${moment.utc(timestamp).format('YYYY-MM-DD-HH-mm')}`
					}
				}
			};
			if (pair) {
				params.KeyConditionExpression += ` AND ${
					CST.DB_TX_QUOTE_BASE_ID
				} BETWEEN :start AND :end`;
				if (params.ExpressionAttributeValues) {
					params.ExpressionAttributeValues[':start'] = { S: `${pair}|` };
					params.ExpressionAttributeValues[':end'] = { S: `${pair}|z` };
				}
			}
		} else {
			const keyConditionExpression = `${this.getPriceKeyField(period)} = :primaryValue`;
			let primaryValue;
			if (period <= 10)
				primaryValue = { S: `${src}|${moment.utc(timestamp).format('YYYY-MM-DD-HH')}` };
			else if (period === 60)
				primaryValue = {
					S: `${src}|${moment.utc(timestamp).format('YYYY-MM-DD')}`
				};
			else if (period > 60)
				primaryValue = {
					S: `${src}|${moment.utc(timestamp).format('YYYY-MM')}`
				};
			else throw new Error('invalid period');

			params = {
				TableName: `${CST.DB_DUO}.${CST.DB_PRICES}.${period}.${
					this.live ? CST.DB_LIVE : CST.DB_DEV
				}`,
				KeyConditionExpression: keyConditionExpression,
				ExpressionAttributeValues: {
					[':primaryValue']: primaryValue
				}
			};

			if (pair) {
				params.KeyConditionExpression += ` AND ${
					CST.DB_QUOTE_BASE_TS
				} BETWEEN :start AND :end`;
				if (params.ExpressionAttributeValues) {
					params.ExpressionAttributeValues[':start'] = { S: `${pair}|${timestamp}` };
					params.ExpressionAttributeValues[':end'] = {
						S: `${pair}|${util.getUTCNowTimestamp()}`
					};
				}
			}
		}

		console.log(params);

		const data = await this.queryData(params);
		if (!data.Items || !data.Items.length) return [];
		console.log('>>>>>>>>>> period: ' + period);

		// console.log(data.Items.map(p => this.parsePrice(p, period)));

		return data.Items.map(
			p => (period > 0 ? this.parsePrice(p, period) : this.parseTradedPrice(p))
		);
	}

	public parsePrice(data: AttributeMap, period: number): IPriceBar {
		return {
			source: (data[this.getPriceKeyField(period)].S || '').split('|')[0],
			base: data[CST.DB_TX_BASE].S || '',
			quote: data[CST.DB_TX_QTE].S || '',
			timestamp: Number((data[CST.DB_QUOTE_BASE_TS].S || '').split('|')[2]),
			period: period,
			open: Number(data[CST.DB_OHLC_OPEN].N),
			high: Number(data[CST.DB_OHLC_HIGH].N),
			low: Number(data[CST.DB_OHLC_LOW].N),
			close: Number(data[CST.DB_OHLC_CLOSE].N),
			volume: Number(data[CST.DB_OHLC_VOLUME].N)
		};
	}

	public parseTradedPrice(data: AttributeMap): IPriceBar {
		const price = Number(data[CST.DB_TX_PRICE].N);
		return {
			source: (data[CST.DB_SRC_DHM].S || '').split('|')[0],
			base: (data[CST.DB_TX_QUOTE_BASE_ID].S || '').split('|')[1],
			quote: (data[CST.DB_TX_QUOTE_BASE_ID].S || '').split('|')[0],
			timestamp: Number(data[CST.DB_TX_TS].N),
			period: 0,
			open: price,
			high: price,
			low: price,
			close: price,
			volume: Number(data[CST.DB_TX_AMOUNT].N)
		};
	}

	public async addPrice(price: IPriceBar) {
		const data: AttributeMap = {
			[CST.DB_TX_BASE]: { S: price.base },
			[CST.DB_TX_QTE]: { S: price.quote },
			[CST.DB_OHLC_OPEN]: { N: price.open + '' },
			[CST.DB_OHLC_HIGH]: { N: price.high + '' },
			[CST.DB_OHLC_LOW]: { N: price.low + '' },
			[CST.DB_OHLC_CLOSE]: { N: price.close + '' },
			[CST.DB_OHLC_VOLUME]: { N: price.volume + '' },
			[CST.DB_QUOTE_BASE_TS]: {
				S: `${price.quote}|${price.base}|${price.timestamp}`
			},
			[CST.DB_UPDATED_AT]: { N: util.getUTCNowTimestamp() + '' }
		};

		if (price.period <= 10)
			data[CST.DB_SRC_DH] = {
				S: `${price.source}|${moment.utc(price.timestamp).format('YYYY-MM-DD-HH')}`
			};
		else if (price.period === 60)
			data[CST.DB_SRC_DATE] = {
				S: `${price.source}|${moment.utc(price.timestamp).format('YYYY-MM-DD')}`
			};
		else if (price.period > 60)
			data[CST.DB_SRC_YM] = {
				S: `${price.source}|${moment.utc(price.timestamp).format('YYYY-MM')}`
			};
		else throw new Error('invalid period');

		return this.insertData({
			TableName: `${CST.DB_DUO}.${CST.DB_PRICES}.${price.period}.${
				this.live ? CST.DB_LIVE : CST.DB_DEV
			}`,
			Item: data
		});
	}

	public async getPrices(
		src: string,
		period: number,
		start: number,
		end: number = 0,
		pair: string = ''
	) {
		util.logDebug(
			`=>priceUtil.getPrices(${src},${String(period)},${util.timestampToString(
				start
			)}, ${util.timestampToString(end)})`
		);
		if (!end) end = util.getUTCNowTimestamp();

		const res = CST.DB_PRICES_PRIMARY_KEY_RESOLUTION[period];
		const primaryKeyPeriodStarts: number[] = [start];
		const dateObj = moment
			.utc(start)
			.startOf(res)
			.add(1, res);
		while (dateObj.valueOf() < end) {
			primaryKeyPeriodStarts.push(dateObj.valueOf());
			dateObj.add(1, res);
		}
		util.logDebug(
			`...... ${JSON.stringify(primaryKeyPeriodStarts.map(x => util.timestampToString(x)))}`
		);

		let prices: IPriceBar[] = [];
		for (const keyPeriodStart of primaryKeyPeriodStarts) {
			const singleKeyPeriodPrices = await dynamoUtil.getSingleKeyPeriodPrices(
				src,
				period,
				keyPeriodStart,
				pair
			);
			singleKeyPeriodPrices.forEach(price => prices.push(price));
		}
		prices = prices.filter(price => price.timestamp >= start && price.timestamp < end);
		prices.sort((a, b) => -a.timestamp + b.timestamp);

		util.logDebug(`...... prices:${String(prices.length)}`);
		return prices;
	}
}

const dynamoUtil = new DynamoUtil();
export default dynamoUtil;
