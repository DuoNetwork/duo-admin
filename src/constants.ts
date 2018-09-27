export * from '../../duo-contract-util/src/constants';

export const EXCHANGE_BITFINEX = 'BITFINEX';
export const EXCHANGE_GEMINI = 'GEMINI';
export const EXCHANGE_KRAKEN = 'KRAKEN';
export const EXCHANGE_GDAX = 'GDAX';

export const AWS_DYNAMO_API_VERSION = '2012-10-08';
// db setting
export const DB_SQL_SCHEMA_PRICEFEED = 'priceFeedDB';
export const DB_SQL_TRADE = 'eth_trades';
export const DB_SQL_HISTORY = 'eth_historical_price';
export const DB_AWS_TRADES_LIVE = 'trades_live';
export const DB_AWS_TRADES_DEV = 'trades_dev';
export const DB_AWS_HOURLY_LIVE = 'hourly_live';
export const DB_AWS_HOURLY_DEV = 'hourly_dev';
export const DB_AWS_MINUTELY_LIVE = 'minutely_live';
export const DB_AWS_MINUTELY_DEV = 'minutely_dev';
export const DB_AWS_EVENTS_LIVE = 'events_live';
export const DB_AWS_EVENTS_DEV = 'events_dev';
export const DB_AWS_STATUS_LIVE = 'status_live';
export const DB_AWS_STATUS_DEV = 'status_dev';
export const DB_AWS_UI_EVENTS_LIVE = 'uiEvents_live';
export const DB_AWS_UI_EVENTS_DEV = 'uiEvents_dev';
export const DB_TX_SRC = 'source';
export const DB_TX_ID = 'id';
export const DB_TX_PRICE = 'price';
export const DB_TX_AMOUNT = 'amount';
export const DB_TX_TS = 'timestamp';
export const DB_TX_SYSTIME = 'systime';
export const DB_TX_SRC_DHM = 'sourceDateHourMinute';
export const DB_HISTORY_PRICE = 'price';
export const DB_HISTORY_TIMESTAMP = 'timestamp';
export const DB_HISTORY_VOLUME = 'volume';
export const DB_HR_SRC_DATE = 'sourceDate';
export const DB_HR_HOUR = 'hour';
export const DB_MN_SRC_DATE_HOUR = 'sourceDateHour';
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

export const AWS_DYNAMO_ROLE_TRADE = 'trade';
export const AWS_DYNAMO_ROLE_HOURLY = 'hourly';
export const AWS_DYNAMO_ROLE_MINUTELY = 'minutely';
export const AWS_DYNAMO_ROLE_EVENT = 'event';
export const AWS_DYNAMO_ROLE_STATUS = 'status';

export const EXCHANGES = [EXCHANGE_BITFINEX, EXCHANGE_GEMINI, EXCHANGE_KRAKEN, EXCHANGE_GDAX];
export const EXCHANGE_WEIGHTAGE_TH: { [index: number]: number[] } = {
	4: [0.35, 0.3, 0.25, 0.2],
	3: [0.55, 0.45, 0.35],
	2: [0.65, 0.5]
};
