export const REDRAW_UPDATE_THRESHOLD = 10;

export const EXCHANGE_BITFINEX = 'BITFINEX';
export const EXCHANGE_GEMINI = 'GEMINI';
export const EXCHANGE_KRAKEN = 'KRAKEN';
export const EXCHANGE_GDAX = 'GDAX';

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
export const AWS_DYNAMO_API_VERSION = '2012-10-08';

export const AWS_DYNAMO_ROLE_TRADE = 'trade';
export const AWS_DYNAMO_ROLE_HOURLY = 'hourly';
export const AWS_DYNAMO_ROLE_MINUTELY = 'minutely';
export const AWS_DYNAMO_ROLE_EVENT = 'event';
export const AWS_DYNAMO_ROLE_STATUS = 'status';

// wallet and contract
export const DUO_CONTRACT_ADDR = '0x7f43B2Dcb3835F137bAc46DC51847a22893B5D9b';
export const CUSTODIAN_ADDR = '0xe5B47c9B13c31aF3EcbbD06AF743bD1ef91617Ea';
export const A_CONTRACT_ADDR = '0x58f498d914F76327017061147DdDE616C7409214';
export const B_CONTRACT_ADDR = '0xaC12aB42E36FE1F48F514419ca13c90911BD0305';
export const INCEPTION_BLK = 7601741;
export const EVENT_ACCEPT_PRICE = 'AcceptPrice';
export const EVENT_START_PRE_RESET = 'StartPreReset';
export const EVENT_START_RESET = 'StartReset';
export const EVENT_START_TRADING = 'StartTrading';
export const EVENT_CREATE = 'Create';
export const EVENT_REDEEM = 'Redeem';
export const EVENT_COMMIT_PRICE = 'CommitPrice';
export const EVENT_TRANSFER = 'Transfer';
export const EVENT_APPROVAL = 'Approval';
export const EVENT_ADD_ADDRESS = 'AddAddress';
export const EVENT_UPDATE_ADDRESS = 'UpdateAddress';
export const EVENT_REMOVE_ADDRESS = 'RemoveAddress';
export const EVENT_SET_VALUE = 'SetValue';
export const EVENT_COLLECT_FEE = 'CollectFee';
export const OTHER_EVENTS = [
	EVENT_START_TRADING,
	EVENT_ACCEPT_PRICE,
	EVENT_CREATE,
	EVENT_REDEEM,
	EVENT_COMMIT_PRICE,
	EVENT_TRANSFER,
	EVENT_APPROVAL,
	EVENT_ADD_ADDRESS,
	EVENT_UPDATE_ADDRESS,
	EVENT_REMOVE_ADDRESS,
	EVENT_SET_VALUE,
	EVENT_COLLECT_FEE
];

export const STATE_INCEPTION = '0';
export const STATE_TRADING = '1';
export const STATE_PRERESET = '2';
export const STATE_DOWN_RESET = '3';
export const STATE_UP_RESET = '4';
export const STATE_PERIOD_RESET = '5';
export const FN_START_CONTRACT = 'startContract';
export const FN_COMMIT_PRICE = 'commitPrice';
export const SRC_MYETHER = 'myether';
export const SRC_INFURA = 'infura';
export const PROVIDER_LOCAL_HTTP = 'http://localhost:8545';
export const PROVIDER_LOCAL_WS = 'ws://localhost:8546';
export const PROVIDER_MYETHER_LIVE = 'https://api.myetherapi.com/eth';
export const PROVIDER_MYETHER_DEV = 'https://api.myetherapi.com/rop';
export const PROVIDER_INFURA_LIVE = 'https://mainnet.infura.io/WSDscoNUvMiL1M7TvMNP';
export const PROVIDER_INFURA_DEV = 'https://kovan.infura.io/WSDscoNUvMiL1M7TvMNP';
export const TRANSFER_TOKEN_INTERVAL = 5; // in seconds
export const TRANSFER_TOKEN_GAS = 120000;
export const TRANSFER_TOKEN_GAS_TH = 20000000000000000;
export const TRANSFER_INTERVAL = 5; // in seconds
export const TRANSFER_GAS_TH = 20000000000000000;
export const REDEEM_INTERVAL = 5; // in seconds
export const REDEEM_GAS = 80000;
export const REDEEM_GAS_TH = 5000000000000000;
export const CREATE_INTERVAL = 5; // in seconds
export const CREATE_GAS = 200000;
export const CREATE_GAS_TH = 10000000000000000;
export const SYS_STATES = {
	0: 'alphaInBP',
	1: 'betaInWei',
	2: 'feeAccumulatedInWei',
	3: 'periodCouponInWei',
	4: 'limitPeriodicInWei',
	5: 'limitUpperInWei',
	6: 'limitLowerInWei',
	7: 'commissionRateInBP',
	8: 'period',
	9: 'iterationGasThreshold',
	10: 'ethDuoFeeRatio',
	11: 'preResetWaitingBlocks',
	12: 'priceTolInBP',
	13: 'priceFeedTolInBP',
	14: 'priceFeedTimeTol',
	15: 'priceUpdateCoolDown',
	16: 'numOfPrices',
	17: 'nextResetAddrIndex',
	18: 'usersLength',
	19: 'addrPoolLength',
	20: 'lastAdminTime',
	21: 'adminCoolDown'
};

// priceFeed
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
export const DB_EVENT_KEY = 'eventKey';
export const DB_EVENT_TIMESTAMP_ID = 'timestampId';
export const DB_EVENT_SYSTIME = 'systime';
export const DB_EVENT_BLOCK_HASH = 'blockHash';
export const DB_EVENT_BLOCK_NO = 'blockNumber';
export const DB_EVENT_TX_HASH = 'transactionHash';
export const DB_EVENT_LOG_STATUS = 'logStatus';
export const DB_STATUS_EVENT_PUBLIC_OTHERS = 'EVENT_AWS_PUBLIC_OTHERS';
export const EXCHANGES = [EXCHANGE_BITFINEX, EXCHANGE_GEMINI, EXCHANGE_KRAKEN, EXCHANGE_GDAX];
export const EXCHANGE_WEIGHTAGE_TH = {
	4: [0.35, 0.3, 0.25, 0.2],
	3: [0.55, 0.45, 0.35],
	2: [0.65, 0.5]
};

export const DEFAULT_GAS_PRICE = 5e9;
export const PRE_RESET_GAS_LIMIT = 120000;
export const RESET_GAS_LIMIT = 7880000;
export const EVENT_FETCH_BLOCK_INTERVAL = 100;
export const EVENT_FETCH_TIME_INVERVAL = 1200000;
