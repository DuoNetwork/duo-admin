import sqlUtil from '../sqlUtil';
import * as CST from '../constants';
import ws from 'ws';

export class GeminiUtil {

	parseTrade(parsedJson: { [key: string]: string | Array<{ [key: string]: string }>}): object {
		let timestampms = parsedJson.timestampms;
		if (timestampms == undefined) {
			timestampms = '';
		}
		const trade = parsedJson.events[0];
		let trade_type = 'buy';

		if (trade['makerSide'] == 'ask') {
			trade_type = 'buy';
		} else if (trade['makerSide'] == 'bid') {
			trade_type = 'sell';
		}

		return {
			[CST.TRADE_ID]: trade['id'],
			[CST.PRICE]: trade['price'],
			[CST.AMOUNT]: trade['amount'],
			[CST.TRADE_TYPE]: trade_type,
			[CST.EXCHANGE_TIME_STAMP]: timestampms
		};
	}

	fetchTrades() {
		const w = new ws('wss://api.gemini.com/v1/marketdata/ETHUSD');

		w.on('message', msg => {
			const parsedJson: any = JSON.parse(msg.toString());

			if (parsedJson.events[0].type == 'trade') {
				// console.log(parsedJson);
				const parsedTrad: object = this.parseTrade(parsedJson);

				// no timestamp returned by exchange so we leave empty there.
				sqlUtil.insertSourceData(
					CST.EXCHANGE_GEMINI,
					parsedTrad[CST.TRADE_ID],
					parsedTrad[CST.PRICE],
					parsedTrad[CST.AMOUNT],
					parsedTrad[CST.TRADE_TYPE],
					parsedTrad[CST.EXCHANGE_TIME_STAMP]
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
