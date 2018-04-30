import sqlUtil from '../sqlUtil';
import * as CST from '../constants';
import ws from 'ws';
import { Trade } from '../types';

export class GeminiUtil {

	parseTrade(parsedJson: any): Trade {
		let timestampms = parsedJson.timestampms;
		if (timestampms == undefined) {
			timestampms = '';
		}
		const trade = parsedJson.events[0];
		let trade_type: string = 'buy';

		if (trade['makerSide'] == 'ask') {
			trade_type = 'buy';
		} else if (trade['makerSide'] == 'bid') {
			trade_type = 'sell';
		}

		return {
			source: CST.EXCHANGE_GEMINI,
			tradeId: trade['tid'],
			price: Number(trade['price']),
			amount: Number(trade['amount']),
			tradeType: trade_type,
			sourceTimestamp: Number(timestampms)
		};
	}

	parseApiResponse(msg: string) {
		const parsedJson: any = JSON.parse(msg);
		// console.log(parsedJson);

		if (parsedJson.events[0].type == 'trade') {
			// console.log(parsedJson);
			const parsedTrade: Trade = this.parseTrade(parsedJson);

			// no timestamp returned by exchange so we leave empty there.
			sqlUtil.insertSourceData(
				parsedTrade
			);
		}
	}

	fetchTrades() {
		const w = new ws('wss://api.gemini.com/v1/marketdata/ETHUSD');

		w.on('message', msg => 	this.parseApiResponse(msg.toString()));

		w.on('open', () => {
			console.log('[Gemini]-WebSocket is open');
		});
	}
}

const geminiUtil = new GeminiUtil();
export default geminiUtil;
