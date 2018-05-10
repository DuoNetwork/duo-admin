export interface Trade {
	source: string;
	id: string;
	price: number;
	amount: number;
	timestamp: number;
}

export interface Price {
	price: number;
	volume: number;
	timestamp: number;
}

export interface Option {
	gasPrice: number;
	gasLimit: number;
	eth: number;
	address: string;
	privateKey: string;
	price: number;
	source: string;
	pwd: string;
	event: string;
}
