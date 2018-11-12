export * from '../../../duo-contract-wrapper/src/constants';
export const TRADES = 'trades';
export const COMMIT = 'commit';
export const SUBSCRIBE = 'subscribe';
export const MINUTELY = 'minutely';
export const HOURLY = 'hourly';
export const NODE = 'node';
export const CLEAN_DB = 'cleanDB';
export const FETCH_PRICE = 'fetchPrice';
export const API_BITFINEX = 'bitfinex';
export const API_GEMINI = 'gemini';
export const API_KRAKEN = 'kraken';
export const API_GDAX = 'gdax';

export const AWS_DYNAMO_API_VERSION = '2012-10-08';
// db setting
export const DB_SQL_SCHEMA_PRICEFEED = 'priceFeedDB';
export const DB_SQL_TRADE = 'trades';
export const DB_SQL_HISTORY = 'historical_price';

export const DB_DUO = 'duo';
export const DB_TRADES = 'trades';
export const DB_LIVE = 'live';
export const DB_DEV = 'dev';
export const DB_PRICES = 'prices';
export const DB_AWS_TRADES_LIVE = 'duo.trades.live';
export const DB_AWS_TRADES_DEV = 'duo.trades.dev';
export const DB_AWS_HOURLY_LIVE = 'duo.prices.60.live';
export const DB_AWS_HOURLY_DEV = 'duo.prices.60.dev';
export const DB_AWS_MINUTELY_LIVE = 'duo.prices.1.live';
export const DB_AWS_MINUTELY_DEV = 'duo.prices.1.dev';
export const DB_AWS_EVENTS_LIVE = 'duo.events.live';
export const DB_AWS_EVENTS_DEV = 'duo.events.dev';
export const DB_AWS_STATUS_LIVE = 'duo.status.live';
export const DB_AWS_STATUS_DEV = 'duo.status.dev';
export const DB_AWS_UI_EVENTS_LIVE = 'duo.uiEvents.live';
export const DB_AWS_UI_EVENTS_DEV = 'duo.uiEvents.dev';
export const DB_TX_QTE = 'quote';
export const DB_TX_BASE = 'base';
export const DB_TX_QUOTE_BASE_ID = 'quoteBaseId';
export const DB_TX_SRC = 'source';
export const DB_TX_ID = 'id';
export const DB_TX_PRICE = 'price';
export const DB_TX_AMOUNT = 'amount';
export const DB_TX_TS = 'timestamp';
export const DB_TX_SYSTIME = 'systime';
export const DB_TX_PAIR = 'pair';
export const DB_UPDATED_AT = 'updatedAt';
export const DB_TX_SRC_DHM = 'sourceDateHourMinute';
export const DB_HISTORY_PRICE = 'price';
export const DB_HISTORY_TIMESTAMP = 'timestamp';
export const DB_QUOTE_BASE_TS = 'quoteBaseTimestamp';
export const DB_HISTORY_VOLUME = 'volume';
export const DB_SRC_DHM = 'sourceDateHourMinute';
export const DB_SRC_DH = 'sourceDateHour';
export const DB_SRC_DATE = 'sourceDate';
export const DB_SRC_YM = 'sourceYearMonth';
export const DB_MN_MINUTE = 'minute';
export const DB_OHLC_OPEN = 'open';
export const DB_OHLC_HIGH = 'high';
export const DB_OHLC_LOW = 'low';
export const DB_OHLC_CLOSE = 'close';
export const DB_OHLC_VOLUME = 'volume';
export const DB_OHLC_TS = 'timestamp';
export const DB_ST_PROCESS = 'process';
export const DB_ST_TS = 'timestamp';
export const DB_ST_BLOCK = 'block';
export const DB_ST_SYSTIME = 'systime';
export const DB_EV_KEY = 'eventKey';
export const DB_EV_TIMESTAMP_ID = 'timestampId';
export const DB_EV_SYSTIME = 'systime';
export const DB_EV_BLOCK_HASH = 'blockHash';
export const DB_EV_BLOCK_NO = 'blockNumber';
export const DB_EV_TX_HASH = 'transactionHash';
export const DB_EV_LOG_STATUS = 'logStatus';
export const DB_EV_PX = 'priceInWei';
export const DB_EV_TS = 'timeInSecond';
export const DB_EV_NAV_A = 'navAInWei';
export const DB_EV_NAV_B = 'navBInWei';
export const DB_EV_TOKEN_A = 'tokenAInWei';
export const DB_EV_TOKEN_B = 'tokenBInWei';
export const DB_EV_ETH = 'ethAmtInWei';
export const DB_EV_ETH_FEE = 'ethFeeInWei';
export const DB_EV_DUO_FEE = 'duoFeeInWei';
export const DB_EV_TOTAL_SUPPLY_A = 'totalSupplyA';
export const DB_EV_TOTAL_SUPPLY_B = 'totalSupplyB';
export const DB_EV_UI_ETH = 'eth';
export const DB_EV_UI_TOKEN_A = 'tokenA';
export const DB_EV_UI_TOKEN_B = 'tokenB';
export const DB_EV_UI_ETH_FEE = 'ethFee';
export const DB_EV_UI_DUO_FEE = 'duoFee';
export const DB_STATUS_EVENT_PUBLIC_OTHERS = 'EVENT_AWS_PUBLIC_OTHERS';

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

export const DB_PRICES_PRIMARY_KEY_RESOLUTION: {
	[period: number]: 'minute' | 'hour' | 'day' | 'month';
} = {
	0: 'minute',
	1: 'hour',
	10: 'hour',
	60: 'day',
	360: 'month',
	1440: 'month'
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
export const API_KRK_BASE_URL = 'https://api.kraken.com';
export const API_KRK_VERSION = '/0/public';
export const API_KRK_ORDER_BOOK = '/Depth';
export const API_KRK_TRADE = '/Trades';
export const API_GDAX_BASE_URL = 'https://api.gdax.com:443/products';
export const API_GDAX_TRADE = '/trades';

export const API_LIST = [API_KRAKEN, API_GEMINI, API_GDAX];
export const EXCHANGE_WEIGHTAGE_TH: { [index: number]: number[] } = {
	4: [0.35, 0.3, 0.25, 0.2],
	3: [0.55, 0.45, 0.35],
	2: [0.65, 0.5]
};
