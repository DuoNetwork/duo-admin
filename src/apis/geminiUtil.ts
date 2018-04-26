import mysqlUtil from '../mysqlUtil';
import * as CST from '../constants';
import ws from 'ws';

export class GeminiUtil {
	fetchETHTradesByOwnWebSocket() {
		const w = new ws('wss://api.gemini.com/v1/marketdata/ETHUSD');

		w.on('message', msg => {
			const parsedJson: any = JSON.parse(msg.toString());

			if (parsedJson.events[0].type == 'trade') {
				let timestampms = parsedJson.timestampms;

				// console.log(parsedJson.events[0]);

				const item = parsedJson.events[0];

				let trade_type = 'buy';

				if (item.makerSide == 'ask') {
					trade_type = 'buy';
				} else if (item.makerSide == 'bid') {
					trade_type = 'sell';
				}

				if (timestampms == undefined) {
					timestampms = '';
				}

				// no timestamp returned by exchange so we leave empty there.
				mysqlUtil.insertDataIntoMysql(
					CST.EXCHANGE_GEMINI,
					item.tid,
					item.price,
					item.amount,
					trade_type,
					timestampms
				);
			}
		});

		w.on('open', () => {
			console.log('[Gemini]-WebSocket is open');
		});
	}
}

const geminiUtil = new GeminiUtil();
export default geminiUtil;
