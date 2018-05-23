import ws from 'ws';
import * as CST from '../constants';
import dbUtil from '../dbUtil';
import { ITrade } from '../types';
import util from '../util';

export class BitfinexUtil {
	public parseTrade(trade: object): ITrade {
		return {
			source: CST.EXCHANGE_BITFINEX,
			id: trade[0] + '',
			price: Number(trade[3]),
			amount: Math.abs(Number(trade[2])),
			timestamp: Number(trade[1])
		};
	}

	public parseApiResponse(msg: string) {
		let parsedJson = JSON.parse(msg.toString());
		// util.log(parsedJson);
		if (parsedJson !== undefined) {
			// handle the snapshot
			if (
				parsedJson.event === undefined &&
				parsedJson[1] !== 'hb' &&
				!(parsedJson[1] === 'te' || parsedJson[1] === 'tu')
			) {
				// util.log(parsedJson);
				const snapshotArr = parsedJson[1];
				snapshotArr.forEach(trade => {
					const parsedTrade: ITrade = this.parseTrade(trade);
					// util.log(parsedTrade);
					dbUtil.insertSourceData(parsedTrade);
				});
			} else if (parsedJson[1] !== 'hb' && parsedJson[1] === 'te') {
				parsedJson = parsedJson[2];

				const parsedTrade: ITrade = this.parseTrade(parsedJson);
				dbUtil.insertSourceData(parsedTrade);
			}
			util.log('one record inserted');
		}
	}

	// Version 2 WebSocket API ---
	public fetchTradesWithoutRetry() {
		const w = new ws('wss://api.bitfinex.com/ws/2');

		w.on('message', m => this.parseApiResponse(m.toString()));

		const msg = JSON.stringify({
			event: 'subscribe',
			channel: 'trades',
			symbol: 'ETHUSD'
		});

		w.on('open', () => {
			util.log('[Bitfinex]-WebSocket is open');
			w.send(msg);
			util.log('subscribe trade');
		});

		w.on('close', (code: number, reason: string) => {
			util.log(code + ': ' + reason);
			util.log('[Bitfinex]-WebSocket is close now');
			util.log('close DB');
		});

		w.on('error', (error: Error) => {
			util.log(error);
		});

		setInterval(() => {
			w.send('ping', function ack(error) {
				util.log(error);
			});
		}, 20 * 1000);
	}

	public fetchTrades() {
		try {
			this.fetchTradesWithoutRetry();
		} catch (err) {
			util.log(err);
			this.fetchTrades();
		}
	}
}
const bitfinexUtil = new BitfinexUtil();
export default bitfinexUtil;
