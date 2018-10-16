import * as CST from '../common/constants';
import { IKrakenRawTrade, ITrade } from '../common/types';
import httpUtil from '../utils/httpUtil';
import util from '../utils/util';
import BaseApi from './BaseApi';

export class KrakenApi extends BaseApi {
	public source: string = CST.API_KRAKEN;
	protected parseTrade(sourcePair: string, trade: string[]): ITrade {
		const { base, quote } = this.parseMarketData(sourcePair);

		return {
			base: base,
			quote: quote,
			source: this.source,
			id: Math.floor(Number(trade[2]) * 10000) + '',
			price: Number(trade[0]),
			amount: Number(trade[1]),
			timestamp: Math.floor(Number(trade[2]) * 1000)
		};
	}

	public fetchTradesWS(): void {
		throw new Error('no ws');
	}

	public async fetchTradesREST(sourcePair: string) {
		const paras = {
			pair: sourcePair
		};
		const url: string =
			CST.API_KRK_BASE_URL +
			CST.API_KRK_VERSION +
			CST.API_KRK_TRADE +
			util.composeQuery(paras);
		util.logInfo(url);

		const response = JSON.parse(await httpUtil.get(url));
		const result: IKrakenRawTrade = response.result;
		let data: string[][] = [];
		for (const key in result)
			if (key !== 'last') {
				data = result[key];
				break;
			}

		await this.addTrades(
			this.sourcePairMapping[sourcePair],
			data.map(trade => this.parseTrade(sourcePair, trade))
		);
	}
}
const krakenApi = new KrakenApi();
export default krakenApi;
