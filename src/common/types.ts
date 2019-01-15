import { ChildProcess } from 'child_process';
export * from '../../../duo-contract-wrapper/src/types';

export interface IBaseMarketData {
	source: string;
	base: string;
	quote: string;
	timestamp: number;
}

export interface ITrade extends IBaseMarketData {
	id: string;
	price: number;
	amount: number;
}

export interface IPriceFix extends IBaseMarketData {
	price: number;
	volume: number;
}

export interface IPrice extends IBaseMarketData {
	period: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

export interface IBaseEvent {
	contractAddress: string;
	timestamp: number;
	transactionHash: string;
	blockNumber: number;
}

export interface IAcceptedPrice extends IBaseEvent {
	price: number;
	navA: number;
	navB: number;
}

export interface ITotalSupply extends IBaseEvent {
	tokenA: number;
	tokenB: number;
}

export interface IConversion extends IBaseEvent {
	type: string;
	eth: number;
	tokenA: number;
	tokenB: number;
	fee: number;
	pending?: boolean;
	reverted?: boolean;
}

export interface IStatus {
	process: string;
	timestamp: number;
}

export interface IPriceStatus extends IStatus {
	price: number;
	volume: number;
}

export interface INodeStatus extends IStatus {
	block: number;
}

export interface IAccount {
	address: string;
	privateKey: string;
}

export interface IKey {
	publicKey: string;
	privateKey: string;
}

export interface ISqlAuth {
	host: string;
	user: string;
	password: string;
}

export interface IOption {
	forceREST: boolean;
	pair: string;
	sources: string[];
	exSources: string[];
	assets: string[];
	live: boolean;
	dbLive: boolean;
	server: boolean;
	dynamo: boolean;
	aws: boolean;
	gcp: boolean;
	azure: boolean;
	force: boolean;
	gasPrice: number;
	gasLimit: number;
	source: string;
	event: string;
	provider: string;
	period: number;
	base: string;
	quote: string;
	contractType: string;
	tenor: string;
}

export interface ISourceSettings {
	priceInversed: boolean;
	quoteInversed: boolean;
	separator: string;
	isLowercase: boolean;
	tradesInterval: number;
	supportWS: boolean;
	filterByTimestamp: boolean;
	wsLink: string;
}

export interface ISourceAsset {
	base: {
		[code: string]: boolean;
	};
	quote: {
		[code: string]: boolean;
	};
	mapping: string;
	name: string;
}
export interface ISource {
	assets: {
		[code: string]: ISourceAsset;
	};
	settings: ISourceSettings;
}

export interface IBitfinexRawTradeWS {
	timestamp: number;
	seq: string;
	id: number;
	price: string;
	amount: string;
}

export interface IBitstampRawTradeRest {
	date: number;
	tid: number;
	price: number;
	type: string;
	amount: number;
}

export interface IBitstampRawTradeWs {
	microtimestamp: string;
	amount: number;
	buy_order_id: number;
	sell_order_id: number;
	amount_str: string;
	price_str: string;
	timestamp: string;
	price: number;
	type: number;
	id: number;
}

export interface IBitfinexRawTradeRest {
	timestamp: number;
	tid: number;
	price: string;
	amount: string;
	exchange: string;
	type: string;
}

export interface IGeminiTradeRest {
	timestamp: number;
	timestampms: number;
	tid: number;
	price: string;
	amount: string;
	exchange: string;
	type: string;
}

export interface IGeminiTradeWs {
	type: string;
	eventid: number;
	socket_sequence: number;
	timestamp: number;
	timestampms: number;
	events: IGeminiTradeData[];
}

export interface IGeminiTradeData {
	type: string;
	tid: number;
	price: string;
	amount: string;
	makerSide: string;
}

export type IKrakenRawTrade = IKrakenRawTradeEntry & {
	last: string;
};

export interface IKrakenRawTradeEntry {
	[pair: string]: string[][];
}

export interface IGdaxRawTradeRest {
	error: string[];
	result: {
		[code: string]: Array<Array<string | number>>;
	};
}

export interface ISubProcess {
	source: string;
	instance: ChildProcess;
	lastFailTimestamp: number;
	failCount: number;
}
