import { Constants, ITrade } from '@finbook/duo-market-data';
import ws from 'ws';
import * as CST from '../common/constants';
import { IGeminiTradeData, IGeminiTradeRest, IGeminiTradeWs } from '../common/types';
import httpUtil from '../utils/httpUtil';
import util from '../utils/util';
import BaseApi from './BaseApi';

export class GeminiApi extends BaseApi {
	public source: string = Constants.API_GEMINI;

	protected parseTradeWS(sourcePair: string, trade: IGeminiTradeWs): ITrade {
		const events: IGeminiTradeData[] = trade.events;
		const { quote, base } = this.parseMarketData(sourcePair);
		return {
			quote: quote,
			base: base,
			source: this.source,
			id: events[0].tid.toString(),
			price: Number(events[0].price),
			amount: Number(events[0].amount),
			timestamp: trade.timestampms
		};
	}

	protected parseTradeREST(sourcePair: string, trade: IGeminiTradeRest): ITrade {
		const { quote, base } = this.parseMarketData(sourcePair);

		return {
			quote: quote,
			base: base,
			source: this.source,
			id: trade.tid.toString(),
			price: Number(trade.price),
			amount: Number(trade.amount),
			timestamp: trade.timestampms
		};
	}

	public async fetchTradesREST(sourcePair: string) {
		const url: string =
			CST.API_GMN_BASE_URL + CST.API_GMN_VERSION + CST.API_GMN_TRADE + '/' + sourcePair;
		util.logInfo(url);

		const result: IGeminiTradeRest[] = JSON.parse(await httpUtil.get(url));
		await this.addTrades(
			this.sourcePairMapping[sourcePair],
			result.map(trade => this.parseTradeREST(sourcePair, trade))
		);
	}
	public fetchTradesWSForPair(sourcePair: string): any {
		const paras = {
			bids: false,
			offers: false,
			trades: true,
			auctions: false,
			heartbeat: true,
			top_of_book: false
		};
		const w = new ws(
			CST.API_GMN_WS_LINK +
				CST.API_GMN_VERSION +
				'/marketdata/' +
				sourcePair +
				util.composeQuery(paras)
		);

		w.on('open', () => {
			util.logInfo('Connected');
			util.logInfo(`Subscribed trades ${sourcePair}`);
		});

		w.on('message', (m: any) => this.handleWSTradeMessage(m.toString(), sourcePair));

		w.on('close', (code: number, reason: string) => {
			util.logError('connection closed ' + code + ' ' + reason);
			w.removeAllListeners();
			w.terminate();
			global.setTimeout(() => this.fetchTradesWSForPair(sourcePair), 1000);
		});

		w.on('error', (error: Error) => {
			util.logError(error);
			w.removeAllListeners();
			w.terminate();
			global.setTimeout(() => this.fetchTradesWSForPair(sourcePair), 1000);
		});
		return w;
	}

	public fetchTradesWS(sourcePairs: string[]) {
		for (const sourcePair of sourcePairs) this.fetchTradesWSForPair(sourcePair);
	}

	public async handleWSTradeMessage(m: string, sourcePair: string) {
		const result: IGeminiTradeWs = JSON.parse(m);
		if (result.type === 'heartbeat')
			util.logInfo(`${this.sourcePairMapping[sourcePair]}: ${m}`);
		else if (
			result.type === 'update' &&
			result.events.length &&
			result.events[0].type === 'trade'
		)
			await this.addTrades(
				this.sourcePairMapping[sourcePair],
				[this.parseTradeWS(sourcePair, result)],
				false
			);
	}
}

const geminiApi = new GeminiApi();
export default geminiApi;
