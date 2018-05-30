import AWS from 'aws-sdk';
import moment from 'moment';
import * as CST from '../constants';
import { ITrade } from '../types';
// import util from '../util';

export class AwsUtil {
	private ddb: undefined | AWS.DynamoDB = undefined;
	private live: boolean = false;
	public init(live: boolean) {
		AWS.config.loadFromPath('./src/keys/aws.json');
		this.live = live;
		this.ddb = new AWS.DynamoDB({ apiVersion: '2012-10-08' });
	}

	public insertSourceData(sourceData: ITrade): Promise<void> {
		const systemTimestamp = Math.floor(Date.now()); // record down the MTS
		const priceStr = sourceData.price.toString();
		const amountStr = sourceData.amount.toString();

		const params = {
			TableName: this.live ? CST.DB_AWS_TRADES : CST.DB_AWS_TRADES_DEV,
			Item: {
				[CST.DB_TX_SRC_DATE]: {
					S:
						sourceData.source +
						'|' +
						moment.utc(sourceData.timestamp).format('YYYY-MM-DD')
				},
				[CST.DB_TX_ID]: { S: sourceData.id },
				[CST.DB_TX_PRICE]: { N: priceStr },
				[CST.DB_TX_AMOUNT]: { N: amountStr },
				[CST.DB_TX_TS]: { N: sourceData.timestamp + '' },
				[CST.DB_TX_SYSTIME]: { N: systemTimestamp + '' }
			}
		};

		return new Promise(
			(resolve, reject) =>
				this.ddb
					? this.ddb.putItem(params, err => (err ? reject(err) : resolve()))
					: reject('db connection is not initialized')
		);
	}
}

const awsUtil = new AwsUtil();
export default awsUtil;
