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
export const DB_PASSWORD = '*OG=ko!Ph0hk';
export const DB_PRICEFEED = 'priceFeedDB';
export const DB_TABLE_TRADE = 'ETH_Trades_Table';
export const DB_TABLE_HISTORY = 'eth_historical_price';

// wallet and contract
export const CUSTODIAN_ADDR = '0xe9a16548c3d816311900148dea51bbc5b609b7fd';
export const PF_ADDR = '0x0022BFd6AFaD3408A1714fa8F9371ad5Ce8A0F1a';
export const PF_ADDR_PK = '5e02a6a6b05fe971309cba0d0bd8f5e85f25e581d18f89eb0b6da753d18aa285';
export const EVENT_ACCEPT_PRICE = 'AcceptPrice';
export const EVENT_START_PRE_RESET = 'StartPreReset';
export const EVENT_START_RESET = 'StartReset';
export const STATE_INCEPTION = '0';
export const STATE_TRADING = '1';
export const STATE_PRERESET = '2';
export const STATE_DOWN_RESET = '3';
export const STATE_UP_RESET = '4';
export const STATE_PERIOD_RESET = '5';
export const INCEPTION_BLK = 7281874;
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
export const TRANSFER_GAS_TH = 200000000000000;
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

export const KOVAN_ACCOUNTS = [
	{
		address: '0x00D8d0660b243452fC2f996A892D3083A903576F',
		privateKey: '16ea9a15dd4381a2ea9c41531fee530e6a78dadc1a86d3e64f207c35f4be1d17'
	},
	{
		address: '0x0022BFd6AFaD3408A1714fa8F9371ad5Ce8A0F1a',
		privateKey: '5e02a6a6b05fe971309cba0d0bd8f5e85f25e581d18f89eb0b6da753d18aa285'
	},
	{
		addrdess: '0x002002812b42601Ae5026344F0395E68527bb0F8',
		privateKey: 'df2fe188d10c269022626e0260b8630562166dd310217faf137a884912420292'
	}
];

// priceFeed
export const DB_TX_SRC = 'source';
export const DB_TX_ID = 'id';
export const DB_TX_PRICE = 'price';
export const DB_TX_AMOUNT = 'amount';
export const DB_TX_TS = 'timestamp';
export const DB_TX_SYSTIME = 'systime';
export const DB_HISTORY_PRICE = 'price';
export const DB_HISTORY_TIMESTAMP = 'timestamp';
export const DB_HISTORY_VOLUME = 'volume';
export const EXCHANGES = [EXCHANGE_BITFINEX, EXCHANGE_GEMINI, EXCHANGE_KRAKEN, EXCHANGE_GDAX];
export const EXCHANGE_WEIGHTAGE_TH = {
	4: [0.35, 0.3, 0.25, 0.2],
	3: [0.55, 0.45, 0.35],
	2: [0.65, 0.5]
};

export const DEFAULT_GAS_PRICE = 5e9;
export const PRE_RESET_GAS_LIMIT = 120000;
export const RESET_GAS_LIMIT = 7880000;
