import ws from 'ws';
import * as CST from '../constants';
import dbUtil from '../dbUtil';
import { ITrade } from '../types';
import util from '../util';

export class BitfinexUtil {
	public parseTrade(trade: number[]): ITrade {
		return {
			source: CST.EXCHANGE_BITFINEX,
			id: trade[0] + '',
			price: Number(trade[2]),
			amount: Math.abs(Number(trade[3])),
			timestamp: Number(trade[1]) * 1000
		};
	}

	public parseApiResponse(msg: string) {
		const parsedJson = JSON.parse(msg.toString());
		if (Array.isArray(parsedJson)) {
			const data = parsedJson[1];
			if (Array.isArray(data))
				data.forEach(trade => {
					const parsedTrade = this.parseTrade(trade);
					dbUtil.insertTradeData(parsedTrade, true);
					util.log(CST.EXCHANGE_BITFINEX + ': record inserted ' + parsedTrade.id);
				});
			else if (data === 'hb') util.log(CST.EXCHANGE_BITFINEX + ': trade channel heartbeat');
			else if (data === 'tu') {
				const parsedTrade = this.parseTrade(parsedJson.slice(3));
				dbUtil.insertTradeData(parsedTrade, true);
				util.log(CST.EXCHANGE_BITFINEX + ': record inserted ' + parsedTrade.id);
			} else util.log(CST.EXCHANGE_BITFINEX + ': ' + msg);
		} else util.log(CST.EXCHANGE_BITFINEX + ': ' + msg);
	}

	public fetchTrades() {
		const w = new ws('wss://api.bitfinex.com/ws/');

		w.on('message', m => this.parseApiResponse(m.toString()));

		const msg = JSON.stringify({
			event: 'subscribe',
			channel: 'trades',
			symbol: 'ETHUSD'
		});

		w.on('open', () => w.send(msg));

		w.on('close', (code: number, reason: string) => {
			util.log(CST.EXCHANGE_BITFINEX + ': ' + code + ' ' + reason);
			util.log(CST.EXCHANGE_BITFINEX + ': restart');
			this.fetchTrades();
		});

		w.on('error', (error: Error) => util.log(CST.EXCHANGE_BITFINEX + ': ' + error));
	}
}
const bitfinexUtil = new BitfinexUtil();
export default bitfinexUtil;
