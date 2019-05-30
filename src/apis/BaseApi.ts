import { IBaseMarketData, ITrade } from '@finbook/duo-market-data';
import ws from 'ws';
import * as CST from '../common/constants';
import { ISource, ISourceAsset, ISourceSettings } from '../common/types';
import sources from '../static/sources.json';
import dbUtil from '../utils/dbUtil';
import util from '../utils/util';

export default abstract class BaseApi {
	public source: string = 'source';

	public settings: ISourceSettings = {
		priceInversed: false,
		quoteInversed: false,
		separator: 'separator',
		isLowercase: false,
		tradesInterval: CST.API_FETCH_TRADE_INTERVAL,
		supportWS: false,
		filterByTimestamp: false,
		wsLink: ''
	};

	public isInitialized: boolean = false;
	public assetsInfo: { [code: string]: ISourceAsset } = {};
	public sourcePairMapping: { [srcPair: string]: string } = {};
	public last: { [localPair: string]: string } = {};
	public tradeStatusLastUpdatedAt: { [key: string]: number } = {};

	public init() {
		if (this.isInitialized) return;

		this.assetsInfo = (sources as { [key: string]: ISource })[this.source].assets;
		this.settings = (sources as { [key: string]: ISource })[this.source].settings;
		util.logInfo(`${this.source} Api initialized`);
	}

	public getSourcePairs(assetIds: string[]): string[] {
		util.logDebug('assets ' + assetIds.join('.'));
		const sourcePairs = [];
		const tickers = Object.keys(this.assetsInfo)
			.map(ticker => (assetIds.includes(this.assetsInfo[ticker].mapping) ? ticker : ''))
			.filter(ticker => ticker !== '');

		for (const baseTicker of tickers)
			for (const quoteTicker of tickers)
				if (
					quoteTicker !== baseTicker &&
					Object.keys(this.assetsInfo[baseTicker].quote).includes(quoteTicker)
				) {
					const quoteLocalCode = this.assetsInfo[quoteTicker].mapping;
					const baseLocalCode = this.assetsInfo[baseTicker].mapping;
					const localPair = quoteLocalCode + '|' + baseLocalCode;

					let sourcePair = '';
					if (this.settings.quoteInversed)
						sourcePair = this.settings.isLowercase
							? baseTicker.toLowerCase() +
							this.settings.separator +
							quoteTicker.toLowerCase()
							: baseTicker.toUpperCase() +
							this.settings.separator +
							quoteTicker.toUpperCase();
					else
						sourcePair = this.settings.isLowercase
							? quoteTicker.toLowerCase() +
							this.settings.separator +
							baseTicker.toLowerCase()
							: quoteTicker.toUpperCase() +
							this.settings.separator +
							baseTicker.toUpperCase();

					this.sourcePairMapping[sourcePair] = localPair;
					sourcePairs.push(sourcePair);
				}

		util.logDebug(
			`BaseApi.getSourcePairs(${JSON.stringify(assetIds)}) => ${JSON.stringify(sourcePairs)}`
		);
		return sourcePairs;
	}

	private filterSortTrades(localPair: string, trades: ITrade[], filterTrades: boolean) {
		//filter and sort in descending order
		const since = filterTrades ? this.last[localPair] : '';

		return trades
			.filter(trade =>
				this.settings.filterByTimestamp
					? trade.timestamp > Number(since)
					: trade.id.localeCompare(since) > 0
			)
			.sort((t1, t2) =>
				this.settings.filterByTimestamp
					? -t1.timestamp + t2.timestamp
					: -t1.id.localeCompare(t2.id)
			);
	}

	public async addTrades(
		localPair: string,
		parsedTrades: ITrade[],
		filterTrades: boolean = true
	) {
		const logMsg: string = `${localPair.split('|')[0]}|${localPair.split('|')[1]}: Received ${
			parsedTrades.length
		} trades; `;

		if (!this.last[localPair]) this.last[localPair] = '';
		if (!this.tradeStatusLastUpdatedAt[localPair]) this.tradeStatusLastUpdatedAt[localPair] = 0;

		const newTrades: ITrade[] = this.filterSortTrades(localPair, parsedTrades, filterTrades);
		const length: number = newTrades.length;

		if (!length) util.logInfo(logMsg + `No new trades since ${this.last[localPair]}`);
		else {
			util.logInfo(
				logMsg +
					`${length} new trades ` +
					(!filterTrades ? '' : `since ${this.last[localPair]}`)
			);

			this.last[localPair] = this.settings.filterByTimestamp
				? newTrades[0].timestamp + ''
				: newTrades[0].id;

			for (let i = 0; i < length; i++) {
				let updateStatusLast: boolean = true;

				//In WS mode, only update trade status.last every 10s
				if (this.settings.supportWS) {
					if (
						util.getUTCNowTimestamp() - this.tradeStatusLastUpdatedAt[localPair] <=
						CST.TRADES_STATUS_LAST_UPDATE_INTERVAL_WS * 1000
					)
						updateStatusLast = false;
				} else this.tradeStatusLastUpdatedAt[localPair] = util.getUTCNowTimestamp();

				await dbUtil.insertTradeData(newTrades[i], !i && updateStatusLast);
			}
		}
	}

	protected parseMarketData(sourcePair: string): IBaseMarketData {
		const [quote, base] = this.sourcePairMapping[sourcePair].split('|');
		return {
			base: base,
			quote: quote,
			source: this.source,
			timestamp: util.getUTCNowTimestamp()
		};
	}

	public async fetchTrades(sourcePairs: string[]) {
		if (!this.settings.supportWS) {
			util.logInfo('Using REST');
			for (const sourcePair of sourcePairs) {
				await this.fetchTradesREST(sourcePair);
				global.setInterval(
					() => this.fetchTradesREST(sourcePair),
					this.settings.tradesInterval * 1000
				);
			}
		} else {
			util.logInfo('Using WS');
			this.fetchTradesWS(sourcePairs);
		}
	}

	public handleWSTradeMessage(msg: string, extraParams: any = {}): void {
		throw new Error(msg + extraParams.toString());
	}

	public handleWSTradeOpen(sourcePairs: string[], w: ws) {
		throw new Error('' + sourcePairs.join(',') + w.url);
	}

	public fetchTradesWS(sourcePairs: string[]): any {
		const w = new ws(this.settings.wsLink);

		w.on('open', () => {
			this.handleWSTradeOpen(sourcePairs, w);
		});

		w.on('message', m => this.handleWSTradeMessage(m.toString(), w));

		w.on('close', (code: number, reason: string) => {
			util.logError('connection closed ' + code + ' ' + reason);
			w.removeAllListeners();
			w.terminate();
			global.setTimeout(() => this.fetchTradesWS(sourcePairs), 1000);
		});

		w.on('error', (error: Error) => {
			util.logError(error);
			w.removeAllListeners();
			w.terminate();
			global.setTimeout(() => this.fetchTradesWS(sourcePairs), 1000);
		});
		return w;
	}

	public abstract fetchTradesREST(sourcePair: string): Promise<void>;
}
