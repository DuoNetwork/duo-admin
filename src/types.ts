export interface Trade {
	source: string;
	tradeId: string;
	price: string;
	amount: string;
	tradeType: string;
	sourceTimestamp: string;
}

export interface Price {
	price: string;
	timestamp: string;
}