export interface ITrade {
	source: string;
	id: string;
	price: number;
	amount: number;
	timestamp: number;
}

export interface IPrice {
	price: number;
	volume: number;
	timestamp: number;
}

export interface IPriceBar {
	source: string;
	date: string;
	hour: string;
	minute: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	timestamp: number;
}

export interface IEvent {
	type: string;
	id: string;
	blockHash: string;
	blockNumber: number;
	transactionHash: string;
	logStatus: string;
	parameters: {[key: string]: string};
	timestamp: number;
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
	live: boolean;
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
}
