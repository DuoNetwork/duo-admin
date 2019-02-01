import { Constants } from '@finbook/duo-market-data';
export const TRADES = 'trades';
export const COMMIT = 'commit';
export const TRIGGER = 'trigger';
export const CLEAN_DB = 'cleanDB';
export const FETCH_PRICE = 'fetchPrice';
export const START_CUSTODIAN = 'startCustodian';
export const FETCH_EVENTS = 'fetchEvents';

// db setting
export const DB_SQL_SCHEMA_PRICEFEED = 'priceFeedDB';
export const DB_SQL_TRADE = 'trades';
export const DB_SQL_HISTORY = 'historical_price';

export const STATUS_INTERVAL = 30;
export const TRADES_STATUS_LAST_UPDATE_INTERVAL_WS = 10;

export const AWS_DYNAMO_ROLE_TRADE = 'trade';
export const AWS_DYNAMO_ROLE_HOURLY = 'hourly';
export const AWS_DYNAMO_ROLE_MINUTELY = 'minutely';
export const AWS_DYNAMO_ROLE_EVENT = 'event';
export const AWS_DYNAMO_ROLE_STATUS = 'status';

export const API_FETCH_TRADE_INTERVAL = 1;
export const LOG_INFO = 'INFO';
export const LOG_ERROR = 'ERROR';
export const LOG_DEBUG = 'DEBUG';
export const LOG_RANKING: { [level: string]: number } = {
	[LOG_ERROR]: 0,
	[LOG_INFO]: 1,
	[LOG_DEBUG]: 2
};

export const API_GMN_BASE_URL = 'https://api.gemini.com';
export const API_GMN_WS_LINK = 'wss://api.gemini.com';
export const API_GMN_VERSION = '/v1';
export const API_GMN_ORDER_BOOK = '/book';
export const API_GMN_TRADE = '/trades';
export const API_BFX_BASE_URL = 'https://api.bitfinex.com';
export const API_BFX_VERSION = '/v1';
export const API_BFX_ORDER_BOOK = '/book/';
export const API_BFX_TRADE = '/trades/';
export const API_BST_PUSHER_APP_KEY = 'de504dc5763aeef9ff52';
export const API_BST_BASE_URL = 'https://www.bitstamp.net/api';
export const API_BST_VERSION = '/v2';
export const API_BST_TRANSACTIONS = '/transactions/';
export const API_KRK_BASE_URL = 'https://api.kraken.com';
export const API_KRK_VERSION = '/0/public';
export const API_KRK_ORDER_BOOK = '/Depth';
export const API_KRK_TRADE = '/Trades';
export const API_GDAX_BASE_URL = 'https://api.gdax.com:443/products';
export const API_GDAX_TRADE = '/trades';

export const API_LIST = [
	Constants.API_KRAKEN,
	Constants.API_GEMINI,
	Constants.API_GDAX,
	Constants.API_BITSTAMP
];
export const EXCHANGE_WEIGHTAGE_TH: { [index: number]: number[] } = {
	5: [0.35, 0.3, 0.25, 0.2, 0.2],
	4: [0.4, 0.35, 0.3, 0.25],
	3: [0.55, 0.45, 0.35],
	2: [0.65, 0.5]
};

export const TRANSFER_TOKEN_INTERVAL = 30; // in seconds
export const TRANSFER_TOKEN_GAS_TH = 0.01; // in ether
export const SET_VALUE_GAS_PRICE = 3; // in Gwei
export const COLLECT_FEE_GAS_PRICE = 4; // in Gwei
export const ADD_ADDR_GAS_PRICE = 5; // in Gwei
export const REMOVE_ADDR_GAS_PRICE = 5; // in Gwei
export const UPDATE_ADDR_GAS_PRICE = 5; // in Gwei
export const TRANSFER_INTERVAL = 10; // in seconds
export const TRANSFER_GAS_TH = 0.01;
export const REDEEM_INTERVAL = 10; // in seconds
export const REDEEM_GAS_TH = 0.005;
export const CREATE_INTERVAL = 10; // in seconds
export const CREATE_GAS_TH = 0.01;
export const EVENT_FETCH_BLOCK_INTERVAL = 100;
export const EVENT_FETCH_TIME_INTERVAL = 600000;
