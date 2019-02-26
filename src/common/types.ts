import { ChildProcess } from 'child_process';

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
	events: string[];
	live: boolean;
	dbLive: boolean;
	server: boolean;
	dynamo: boolean;
	aws: boolean;
	gcp: boolean;
	azure: boolean;
	force: boolean;
	source: string;
	event: string;
	provider: string;
	period: number;
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
