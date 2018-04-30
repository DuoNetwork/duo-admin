export const REDRAW_UPDATE_THRESHOLD = 10;

// export const provider = "https://mainnet.infura.io/Ky03pelFIxoZdAUsr82w";
export const provider = 'https://kovan.infura.io/WSDscoNUvMiL1M7TvMNP ';
// export const provider = "http://localhost:8545";

export const EXCHANGE_BITFINEX = 'BITFINEX';
export const EXCHANGE_GEMINI = 'GEMINI';
export const EXCHANGE_KRAKEN = 'KRAKEN';
export const EXCHANGE_GDAX = 'GDAX';

// db setting
export const DB_HOST = 'localhost';
export const DB_USER = 'root';
export const DB_PASSWORD = '';
export const DB_PRICEFEED = 'priceFeedDB';
export const DB_TABLE_TRADE = 'ETH_Trades_Table';
export const DB_TABLE_HISTORY = 'eth_historical_price';

// wallet and contract
export const NETWORK = 'http://localhost:8545';
export const CUSTODIAN_ADDR = '0xfa28c05288f84e0d59aaa250fc1fa379a304d7ae';
export const PF_ADDR = '0x0022BFd6AFaD3408A1714fa8F9371ad5Ce8A0F1a';
export const PF_ADDR_PK = '5e02a6a6b05fe971309cba0d0bd8f5e85f25e581d18f89eb0b6da753d18aa285';
export const ETHSCAN_API_KEY = '8VS7KBP65Q7TQE4NGNUDEF69M6M6TH4BRS';
export const ETHSCAN_API_KOVAN_LINK = 'https://api-kovan.etherscan.io/api?';
export const KOVAN_FROM_BLOCK = '6900000';
export const ACCEPT_PRICE_EVENT = '0x8eb94c6a87f56bd59f4a2a7d571f32a264458ff5b910a34862b9051e5953442d';

// priceFeed
export const EXCHANGE_SRC = 'exchangeSource';
export const TRADE_ID = 'tradeId';
export const PRICE = 'price';
export const AMOUNT = 'amount';
export const TRADE_TYPE  = 'tradeType';
export const EXCHANGE_TIME_STAMP = 'exchangeTimeStamp';
export const TIMESTAMP = 'timestamp';

export const DB_TX_EXCHANGE_SRC = 'exchange_source';
export const DB_TX_TRADE_ID = 'trade_id';
export const DB_TX_PRICE = 'price';
export const DB_TX_AMOUNT = 'amount';
export const DB_TX_TYPE  = 'trade_type';
export const DB_TX_EXCHANGE_TIME_STAMP = 'exchange_returned_timestamp';
export const DB_TX_SYS_TIMESTAMP = 'system_timestamp';
export const DB_HISTORY_PRICE = 'price';
export const DB_HISTORY_TIMESTAMP = 'timestamp';
export const EXCHANGES = [EXCHANGE_BITFINEX, EXCHANGE_GEMINI, EXCHANGE_KRAKEN, EXCHANGE_GDAX];
export const EXCHANGE_WEIGHTAGE_TH = {
	'4': [0.35, 0.3, 0.25, 0.2],
	'3': [0.55, 0.45, 0.35],
	'2': [0.65, 0.5]
};
