import ws from 'ws';
import * as CST from '../constants';
import dbUtil from '../dbUtil';
import { ITrade } from '../types';
import util from '../util';

let last: number = 0;
export class GeminiUtil {
	public parseTrade(parsedJson: any): ITrade {
		const timestampms = parsedJson.timestampms || '';
		const trade = parsedJson.events[0];

		return {
			source: CST.EXCHANGE_GEMINI,
			id: trade.tid + '',
			price: Number(trade.price),
			amount: Math.abs(Number(trade.amount)),
			timestamp: Number(timestampms)
		};
	}

	public parseApiResponse(msg: string) {
		const parsedJson: any = JSON.parse(msg);
		// util.log(parsedJson);

		if (parsedJson.events[0].type === 'trade') {
			// util.log(parsedJson);
			const parsedTrade: ITrade = this.parseTrade(parsedJson);

			// no timestamp returned by exchange so we leave empty there.
			if (parsedTrade.timestamp - last >= 1000) {
				last = parsedTrade.timestamp;
				dbUtil.insertTradeData(parsedTrade, true);
			} else dbUtil.insertTradeData(parsedTrade, false);

			util.log(CST.EXCHANGE_GEMINI + ': trade fetched and inserted ' + parsedTrade.id);
		}
	}

	public fetchTrades() {
		const w = new ws('wss://api.gemini.com/v1/marketdata/ETHUSD');

		w.on('message', msg => this.parseApiResponse(msg.toString()));

		w.on('open', () => util.log(CST.EXCHANGE_GEMINI + ': webSocket is open'));

		w.on('close', (code: number, reason: string) => {
			util.log(CST.EXCHANGE_GEMINI + ': ' + code + ' ' + reason);
			util.log(CST.EXCHANGE_GEMINI + ': restart');
			this.fetchTrades();
		});

		w.on('error', (error: Error) => util.log(CST.EXCHANGE_GEMINI + ': ' + error));
	}
}

const geminiUtil = new GeminiUtil();
export default geminiUtil;
