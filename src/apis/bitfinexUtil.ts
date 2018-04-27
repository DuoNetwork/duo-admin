import ws from 'ws';
import sqlUtil from '../sqlUtil';
import * as CST from '../constants';
import { Trade } from '../types';

export class BitfinexUtil {
	parseTrade(trade: object): Trade {
		const amount: number = parseFloat(trade[2]);
		let trade_type: string = 'buy';
		if (amount > 0) {
			trade_type = 'buy';
		} else {
			trade_type = 'sell';
		}
		return {
			source: CST.EXCHANGE_BITFINEX,
			tradeId: trade[0] + '',
			price: trade[3] + '',
			amount: Math.abs(amount) + '',
			tradeType: trade_type,
			sourceTimestamp: trade[1] + ''
		};
	}

	parseApiResponse(msg: string) {
		let parsedJson = JSON.parse(msg.toString());
		// console.log(parsedJson);
		if (parsedJson != undefined) {
			// handle the snapshot
			if (
				parsedJson.event === undefined &&
				parsedJson[1] != 'hb' &&
				!(parsedJson[1] == 'te' || parsedJson[1] == 'tu')
			) {
				// console.log(parsedJson);
				const snapshotArr = parsedJson[1];
				snapshotArr.forEach(trade => {
					const parsedTrade: Trade = this.parseTrade(trade);
					// console.log(parsedTrade);
					sqlUtil.insertSourceData(parsedTrade);
				});
			} else if (parsedJson[1] != 'hb' && parsedJson[1] == 'te') {
				parsedJson = parsedJson[2];

				const parsedTrade: Trade = this.parseTrade(parsedJson);
				sqlUtil.insertSourceData(parsedTrade);
			}
		}
	}

	// Version 2 WebSocket API ---
	fetchTrades() {
		const w = new ws('wss://api.bitfinex.com/ws/2');

		w.on('message', msg => this.parseApiResponse(msg.toString()));

		const msg = JSON.stringify({
			event: 'subscribe',
			channel: 'trades',
			symbol: 'ETHUSD'
		});

		w.on('open', () => {
			console.log('[Bitfinex]-WebSocket is open');
			w.send(msg);
			console.log('subscribe trade');
		});

		w.on('close', () => {
			console.log('[Bitfinex]-WebSocket is close now');
			console.log('close DB');
		});
	}
}
const bitfinexUtil = new BitfinexUtil();
export default bitfinexUtil;
