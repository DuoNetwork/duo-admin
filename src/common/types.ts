export * from '../../../duo-contract-util/src/types';

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
	eth: number;
	address: string;
	addr1: string;
	addr2: string;
	privateKey: string;
	price: number;
	source: string;
	pwd: string;
	event: string;
	provider: string;
	contractState: string;
	accountNum: number;
	saveAccount: boolean;
	from: string;
	to: string;
	value: number;
	index: number;
	total: number;
	minEther: number;
	alpha: number;
	amtA: number;
	amtB: number;
	numOfMinutes: number;
	numOfHours: number;
	key: string;
	endBlk: number;
	period: number;
	base: string;
	quote: string;
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
