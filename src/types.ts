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