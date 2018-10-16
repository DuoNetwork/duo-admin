import moment from 'moment';
import * as CST from '../common/constants';
import { ITrade } from '../common/types';
import httpUtil from '../utils/httpUtil';
import util from '../utils/util';
import BaseApi from './BaseApi';

export class GdaxApi extends BaseApi {
	public source: string = CST.API_GDAX;
	public parseTrade(sourcePair: string, trade: { [key: string]: string | number }): ITrade {
		const { base, quote } = this.parseMarketData(sourcePair);
		return {
			base: base,
			quote: quote,
			source: CST.API_GDAX,
			id: trade.trade_id + '',
			price: Number(trade.price),
			amount: Math.abs(Number(trade.size)),
			timestamp: moment(trade.time).valueOf()
		};
	}

	public async fetchTradesREST(sourcePair: string) {
		const url: string = CST.API_GDAX_BASE_URL + '/' + sourcePair + CST.API_GDAX_TRADE;
		util.logInfo(url);
		const res = await httpUtil.get(url);
		const result: Array<{ [key: string]: string }> = JSON.parse(res);
		await this.addTrades(
			this.sourcePairMapping[sourcePair],
			result.map(trade => this.parseTrade(sourcePair, trade))
		);
	}

	public fetchTradesWS(): void {
		throw new Error('no ws');
	}
}

const gdaxApi = new GdaxApi();
export default gdaxApi;
