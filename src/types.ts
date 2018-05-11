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

export interface IOption {
	live: boolean;
	gasPrice: number;
	gasLimit: number;
	eth: number;
	address: string;
	privateKey: string;
	price: number;
	source: string;
	pwd: string;
	event: string;
	provider: string;
}
