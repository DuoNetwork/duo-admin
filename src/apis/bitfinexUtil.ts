import ws from 'ws';
import sqlUtil from '../sqlUtil';
import * as CST from '../constants';

export class BitfinexUtil {
	parseTrade(trade: object): object {
		const amount: number = parseFloat(trade[2]);
		let trade_type: string = 'buy';
		if (amount > 0) {
			trade_type = 'buy';
		} else {
			trade_type = 'sell';
		}
		return {
			[CST.TRADE_ID]: trade[0],
			[CST.PRICE]: trade[3] + '',
			[CST.AMOUNT]: Math.abs(amount) + '',
			[CST.TRADE_TYPE]: trade_type,
			[CST.EXCHANGE_TIME_STAMP]: trade[1]
		};
	}

	// Version 2 WebSocket API ---
	fetchTrades() {
		const w = new ws('wss://api.bitfinex.com/ws/2');

		w.on('message', msg => {
			let parsedJson = JSON.parse(msg.toString());
			if (parsedJson != undefined) {
				// handle the snopshot
				if (
					parsedJson.event === undefined &&
					parsedJson[1] != 'hb' &&
					!(parsedJson[1] == 'te' || parsedJson[1] == 'tu')
				) {
					// console.log(parsedJson);
					const snopshotArr = parsedJson[1];
					snopshotArr.forEach(trade => {
						const parsedTrad: object = this.parseTrade(trade);

						sqlUtil.insertSourceData(
							CST.EXCHANGE_BITFINEX,
							parsedTrad[CST.TRADE_ID],
							parsedTrad[CST.PRICE],
							parsedTrad[CST.AMOUNT],
							parsedTrad[CST.TRADE_TYPE],
							parsedTrad[CST.EXCHANGE_TIME_STAMP]
						);
					});
				} else if (parsedJson[1] != 'hb' && parsedJson[1] == 'te') {
					parsedJson = parsedJson[2];

					const parsedTrad: object = this.parseTrade(parsedJson);
					sqlUtil.insertSourceData(
						CST.EXCHANGE_BITFINEX,
						parsedTrad[CST.TRADE_ID],
						parsedTrad[CST.PRICE],
						parsedTrad[CST.AMOUNT],
						parsedTrad[CST.TRADE_TYPE],
						parsedTrad[CST.EXCHANGE_TIME_STAMP]
					);
				}
			}
		});

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
