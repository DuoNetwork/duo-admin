import Pusher from 'pusher-js';
import * as CST from '../common/constants';
import { IBitstampRawTradeRest, IBitstampRawTradeWs, ITrade } from '../common/types';
import httpUtil from '../utils/httpUtil';
import util from '../utils/util';
import BaseApi from './BaseApi';

export class BitfinexApi extends BaseApi {
	public source: string = CST.API_BITSTAMP;

	protected parseTradeWS(sourcePair: string, trade: IBitstampRawTradeWs): ITrade {
		const { base, quote } = this.parseMarketData(sourcePair);
		return {
			base: base,
			quote: quote,
			source: this.source,
			id: trade.id + '',
			price: trade.price,
			amount: Math.abs(trade.amount),
			timestamp: Number(trade.timestamp) * 1000
		};
	}

	protected parseTradeREST(sourcePair: string, trade: IBitstampRawTradeRest): ITrade {
		const { base, quote } = this.parseMarketData(sourcePair);
		return {
			base: base,
			quote: quote,
			source: this.source,
			id: trade.tid + '',
			price: Number(trade.price),
			amount: Number(trade.amount),
			timestamp: trade.date * 1000
		};
	}

	public async handleWSTradeMessage(m: string, sourcePair: string) {
		const data = JSON.parse(m);
		await this.addTrades(
			this.sourcePairMapping[sourcePair],
			[this.parseTradeWS(sourcePair, data)],
			false
		);
	}

	public async fetchTradesREST(sourcePair: string) {
		const localPair = this.sourcePairMapping[sourcePair];
		const url: string =
			CST.API_BST_BASE_URL +
			CST.API_BST_VERSION +
			CST.API_BST_TRANSACTIONS +
			sourcePair +
			(this.last[localPair] ? util.composeQuery({ since: this.last[localPair] }) : '');
		util.logInfo(url);

		const result: IBitstampRawTradeRest[] = JSON.parse(await httpUtil.get(url));
		await this.addTrades(
			this.sourcePairMapping[sourcePair],
			result.map(trade => this.parseTradeREST(sourcePair, trade))
		);
	}

	public fetchTradesWS(sourcePairs: string[]) {
		for (const sourcePair of sourcePairs) {
			const socket = new Pusher('de504dc5763aeef9ff52');

			socket.bind('trade', trade => {
				this.handleWSTradeMessage(JSON.stringify(trade), sourcePair);
			});

			util.logInfo(`Subscribed to trades ${sourcePair}`);
			socket.subscribe(`live_trades_${sourcePair}`);

			socket.connection.bind('error', err => {
				if (err.error.data.code === 4004) {
					util.logError('Over limit!');
					socket.disconnect();
					setTimeout(() => socket.connect(), 30000);
				}
			});
		}
	}
}
const bitfinexApi = new BitfinexApi();
export default bitfinexApi;
