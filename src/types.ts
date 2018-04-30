export interface Trade {
	source: string;
	tradeId: string;
	price: number;
	amount: number;
	tradeType: string;
	sourceTimestamp: number;
}

export interface Price {
	price: number;
	volume: number;
	timestamp: number;
}