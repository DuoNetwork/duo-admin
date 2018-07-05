export const REDRAW_UPDATE_THRESHOLD = 10;

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

// wallet and contract
export const DUO_CONTRACT_ADDR_KOVAN = '0xa8Cac43aA0C2B61BA4e0C10DC85bCa02662E1Bee';
export const CUSTODIAN_ADDR_KOVAN = '0x74f489a6c06F799d33b9fbC017d89d5A3eca1401' // '0x72c89F7e11C845c4ADb7280d1990b3e54F84B417';
export const A_CONTRACT_ADDR_KOVAN = '0x1f88d9aa39B3ae420c44d408cd2Fe1B87029bF3F';
export const B_CONTRACT_ADDR_KOVAN = '0x4C4ea4CC0ca787C892b24dB9C450dd6d4C777D77';
export const DUO_CONTRACT_ADDR_MAIN = '0x0';
export const CUSTODIAN_ADDR_MAIN = '0x0';
export const A_CONTRACT_ADDR_MAIN = '0x0';
export const B_CONTRACT_ADDR_MAIN = '0x0';
export const INCEPTION_BLK = 7708523;
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
export const EVENT_TOTAL_SUPPLY = 'TotalSupply';
export const EVENTS = [
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
	EVENT_COLLECT_FEE,
	EVENT_TOTAL_SUPPLY,
	EVENT_START_PRE_RESET,
	EVENT_START_RESET
];

export const STATE_INCEPTION = '0';
export const STATE_TRADING = '1';
export const STATE_PRERESET = '2';
export const STATE_UP_RESET = '3';
export const STATE_DOWN_RESET = '4';
export const STATE_PERIOD_RESET = '5';
export const FN_START_CONTRACT = 'startContract';
export const FN_COMMIT_PRICE = 'commitPrice';
export const SRC_MYETHER = 'myether';
export const SRC_INFURA = 'infura';
export const PROVIDER_LOCAL_HTTP = 'http://localhost:8545';
export const PROVIDER_LOCAL_WS = 'ws://localhost:8546';
export const PROVIDER_MYETHER_MAIN = 'https://api.myetherapi.com/eth';
export const PROVIDER_MYETHER_ROP = 'https://api.myetherapi.com/rop';
export const PROVIDER_INFURA_MAIN = 'https://mainnet.infura.io';
export const PROVIDER_INFURA_KOVAN = 'https://kovan.infura.io';
export const TRANSFER_TOKEN_INTERVAL = 30; // in seconds
export const TRANSFER_TOKEN_GAS = 120000;
export const TRANSFER_TOKEN_GAS_TH = 0.01; // in ether
export const SET_VALUE_GAS = 50000;
export const SET_VALUE_GAS_PRICE = 3; // in Gwei
export const COLLECT_FEE_GAS = 40000;
export const COLLECT_FEE_GAS_PRICE = 4; // in Gwei
export const ADD_ADDR_GAS = 40000;
export const ADD_ADDR_GAS_PRICE = 5; // in Gwei
export const REMOVE_ADDR_GAS = 40000;
export const REMOVE_ADDR_GAS_PRICE = 5; // in Gwei
export const UPDATE_ADDR_GAS = 40000;
export const UPDATE_ADDR_GAS_PRICE = 5; // in Gwei
export const TRANSFER_INTERVAL = 10; // in seconds
export const TRANSFER_GAS_TH = 0.01;
export const REDEEM_INTERVAL = 10; // in seconds
export const REDEEM_GAS = 80000;
export const REDEEM_GAS_TH = 0.005;
export const CREATE_INTERVAL = 10; // in seconds
export const CREATE_GAS = 160000;
export const CREATE_GAS_TH = 0.01;
export const DEFAULT_GAS_PRICE = 5;
export const PRE_RESET_GAS_LIMIT = 120000;
export const RESET_GAS_LIMIT = 7880000;
export const EVENT_FETCH_BLOCK_INTERVAL = 100;
export const EVENT_FETCH_TIME_INVERVAL = 600000;
export const SYS_STATES = {
	0: 'state',
	1: 'navAInWei',
	2: 'navBInWei',
	3: 'totalSupplyA',
	4: 'totalSupplyB',
	5: 'alphaInBP',
	6: 'betaInWei',
	7: 'feeAccumulatedInWei',
	8: 'periodCouponInWei',
	9: 'limitPeriodicInWei',
	10: 'limitUpperInWei',
	11: 'limitLowerInWei',
	12: 'commissionRateInBP',
	13: 'period',
	14: 'iterationGasThreshold',
	15: 'ethDuoFeeRatio',
	16: 'preResetWaitingBlocks',
	17: 'priceTolInBP',
	18: 'priceFeedTolInBP',
	19: 'priceFeedTimeTol',
	20: 'priceUpdateCoolDown',
	21: 'numOfPrices',
	22: 'nextResetAddrIndex',
	23: 'lastAdminTime',
	24: 'adminCoolDown',
	25: 'usersLength',
	26: 'addrPoolLength'
};

export const EXCHANGES = [EXCHANGE_BITFINEX, EXCHANGE_GEMINI, EXCHANGE_KRAKEN, EXCHANGE_GDAX];
export const EXCHANGE_WEIGHTAGE_TH: {[index: number]: number[]} = {
	4: [0.35, 0.3, 0.25, 0.2],
	3: [0.55, 0.45, 0.35],
	2: [0.65, 0.5]
};
