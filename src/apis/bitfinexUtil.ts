import ws from 'ws';
import sqlUtil from '../sqlUtil';
import * as CST from '../constants';

export class BitfinexUtil {
	// Version 2 WebSocket API ---
	fetchETHTradesByOwnWebSocket() {
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
					snopshotArr.forEach(element => {
						// console.log("===>"+element);
						const amount: number = parseFloat(element[2]);
						let trade_type: string = 'buy';
						if (amount > 0) {
							trade_type = 'buy';
						} else {
							trade_type = 'sell';
						}
						// console.log("=>"+trade_type);
						sqlUtil.insertSourceData(
							CST.EXCHANGE_BITFINEX,
							element[0],
							element[3] + '',
							Math.abs(amount) + '',
							trade_type,
							element[1]
						);
					});
				} else if (parsedJson[1] != 'hb' && parsedJson[1] == 'te') {
					// console.log("<==="+parsedJson);
					parsedJson = parsedJson[2];
					const amount: number = parseFloat(parsedJson[2]);
					let trade_type: string = 'buy';
					if (amount > 0) {
						trade_type = 'buy';
					} else {
						trade_type = 'sell';
					}
					// console.log("=>"+trade_type);
					sqlUtil.insertSourceData(
						CST.EXCHANGE_BITFINEX,
						parsedJson[0],
						parsedJson[3] + '',
						Math.abs(amount) + '',
						trade_type,
						parsedJson[1]
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
