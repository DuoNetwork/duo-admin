import ws from 'ws';
import sqlUtil from '../sqlUtil';
import * as CST from '../constants';
import util from '../util';
import { Trade } from '../types';

export class GeminiUtil {
	parseTrade(parsedJson: any): Trade {
		let timestampms = parsedJson.timestampms;
		if (timestampms == undefined) {
			timestampms = '';
		}
		const trade = parsedJson.events[0];

		return {
			source: CST.EXCHANGE_GEMINI,
			id: trade['tid'],
			price: Number(trade['price']),
			amount: Math.abs(Number(trade['amount'])),
			timestamp: Number(timestampms)
		};
	}

	parseApiResponse(msg: string) {
		const parsedJson: any = JSON.parse(msg);
		// util.log(parsedJson);

		if (parsedJson.events[0].type == 'trade') {
			// util.log(parsedJson);
			const parsedTrade: Trade = this.parseTrade(parsedJson);

			// no timestamp returned by exchange so we leave empty there.
			sqlUtil.insertSourceData(parsedTrade);
			util.log('one trade fetched and inserted');
		}
	}

	fetchTrades() {
		const w = new ws('wss://api.gemini.com/v1/marketdata/ETHUSD');

		w.on('message', msg => this.parseApiResponse(msg.toString()));

		w.on('open', () => {
			util.log('[Gemini]-WebSocket is open');
		});

		w.on('close', (code: number, reason: string) => {
			util.log(code + ': ' + reason);
		});

		w.on('error', (error: Error) => {
			util.log(error);
		});
	}
}

const geminiUtil = new GeminiUtil();
export default geminiUtil;
