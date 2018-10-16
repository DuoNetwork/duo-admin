import * as CST from '../common/constants';
import {IBitfinexRawTradeRest, IBitfinexRawTradeWS, ITrade } from '../common/types';
import util from '../utils/util';
import BaseApi from './BaseApi';

const BFX = require('bitfinex-api-node');

export class BitfinexApi extends BaseApi {
	public source: string = CST.API_BITFINEX;

	protected parseTradeWS(sourcePair: string, trade: IBitfinexRawTradeWS): ITrade {
		const { base, quote } = this.parseMarketData(sourcePair);
		return {
			base: base,
			quote: quote,
			source: this.source,
			id: trade.id + '',
			price: Number(trade.price),
			amount: Math.abs(Number(trade.amount)),
			timestamp: Number(trade.timestamp) * 1000
		};
	}

	protected parseTradeREST(sourcePair: string, trade: IBitfinexRawTradeRest): ITrade {
		const { base, quote } = this.parseMarketData(sourcePair);
		return {
			base: base,
			quote: quote,
			source: this.source,
			id: trade.tid + '',
			price: Number(trade.price),
			amount: Number(trade.amount),
			timestamp: trade.timestamp * 1000
		};
	}

	public async handleWSTradeMessage(m: string, sourcePair: string) {
		const data = JSON.parse(m);

		// Will ignore batch of trades, because snapshot does not contain trade id.
		// if single trade and is 'tu' event
		if (!Array.isArray(data) && data.hasOwnProperty('id') && sourcePair)
			await this.addTrades(
				this.sourcePairMapping[sourcePair],
				[this.parseTradeWS(sourcePair, data)],
				false
			);
	}

	public async fetchTradesREST(sourcePair: string) {
		const localPair = this.sourcePairMapping[sourcePair];
		const url: string =
			CST.API_BFX_BASE_URL +
			CST.API_BFX_VERSION +
			CST.API_BFX_TRADE +
			sourcePair +
			(this.last[localPair] ? util.composeQuery({ since: this.last[localPair] }) : '');
		util.logInfo(url);

		const result: IBitfinexRawTradeRest[] = JSON.parse(await util.get(url));
		await this.addTrades(
			this.sourcePairMapping[sourcePair],
			result.map(trade => this.parseTradeREST(sourcePair, trade))
		);
	}

	public fetchTradesWS(sourcePairs: string[]) {
		const bfx = new BFX(null, null, {
			version: 1,
			transform: true
		});

		const w = bfx.ws;
		w.on('open', () => {
			util.logInfo('Connected');
			for (const pair of sourcePairs) {
				w.subscribeTrades(pair);
				util.logInfo(`Subscribed to trades ${pair}`);
			}
		});

		w.on('trade', (symbol: string, trades: any) => {
			this.handleWSTradeMessage(JSON.stringify(trades), symbol);
		});

		w.on('close', (code: number, reason: string) => {
			util.logError('connection closed ' + code + ' ' + reason);
			w.close();
			setTimeout(() => this.fetchTradesWS(sourcePairs), 1000);
		});

		w.on('error', (error: Error) => {
			util.logError(error);
			w.close();
			setTimeout(() => this.fetchTradesWS(sourcePairs), 1000);
		});
	}
}
const bitfinexApi = new BitfinexApi();
export default bitfinexApi;
