import ws from 'ws';
import sqlUtil from '../sqlUtil';
import * as CST from '../constants';

export class BitfinexUtil {
	// Version 2 WebSocket API ---
	parseTrade(trade: object): string[] {
		const amount: number = parseFloat(trade[2]);
		let trade_type: string = 'buy';
		if (amount > 0) {
			trade_type = 'buy';
		} else {
			trade_type = 'sell';
		}
		return [trade[0], trade[3] + '', Math.abs(amount) + '', trade_type, trade[1]];
	}

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
					snopshotArr.forEach(trade => {

						let tradeID: string,
							price: string,
							amount: string,
							tradeType: string,
							exchangeTimeStamp: string;

						[tradeID, price, amount, tradeType, exchangeTimeStamp] = this.parseTrade(
							trade
						);

						sqlUtil.insertDataIntoMysql(
							CST.EXCHANGE_BITFINEX,
							tradeID,
							price,
							amount,
							tradeType,
							exchangeTimeStamp
						);
					});
				} else if (parsedJson[1] != 'hb' && parsedJson[1] == 'te') {
					parsedJson = parsedJson[2];
					const amount: number = parseFloat(parsedJson[2]);
					let trade_type: string = 'buy';
					if (amount > 0) {
						trade_type = 'buy';
					} else {
						trade_type = 'sell';
					}
					sqlUtil.insertDataIntoMysql(
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
