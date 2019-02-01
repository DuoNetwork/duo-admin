import { Constants, ITrade } from '@finbook/duo-market-data';
import moment from 'moment';
import * as CST from '../common/constants';
import httpUtil from '../utils/httpUtil';
import util from '../utils/util';
import BaseApi from './BaseApi';

export class GdaxApi extends BaseApi {
	public source: string = Constants.API_GDAX;
	public parseTrade(sourcePair: string, trade: { [key: string]: string | number }): ITrade {
		const { base, quote } = this.parseMarketData(sourcePair);
		return {
			base: base,
			quote: quote,
			source: this.source,
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
