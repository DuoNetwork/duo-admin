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
export const CUSTODIAN_ADDR = '0x363b5bd6dd8e093bd6d4d45ee8ae6559a24ff937';
export const PF_ADDR = '0x0022BFd6AFaD3408A1714fa8F9371ad5Ce8A0F1a';
export const PF_ADDR_PK = '5e02a6a6b05fe971309cba0d0bd8f5e85f25e581d18f89eb0b6da753d18aa285';
export const ETHSCAN_API_KEY = '8VS7KBP65Q7TQE4NGNUDEF69M6M6TH4BRS';
export const ETHSCAN_API_KOVAN_LINK = 'https://api-kovan.etherscan.io/api?';
export const KOVAN_FROM_BLOCK = '6900000';
export const ACCEPT_PRICE_EVENT = 'AcceptPrice(uint256,uint256)'; // '0x8eb94c6a87f56bd59f4a2a7d571f32a264458ff5b910a34862b9051e5953442d';
export const START_PRE_RESET_EVENT = 'StartPreReset()'; // '0xa1f85a3680dfb51f7db8069e794f07f371ef5a545a9c915ac6315b0768a08b3f';
export const START_RESET_EVENT = 'StartReset()'; // '0x91c286863163aa15991e5aabc5934ed57007ed7f0b1bddcde66ca789ab227ea3';
export const START_TRADING_EVENT = 'StartTrading()'; // '0xbf6a1c0d2669c1534a4b018edab32445ffb4f4e914517f62fb885949552d7e34';
export const STATE_INCEPTION = '0';
export const STATE_TRADING = '1';
export const STATE_PRERESET = '2';
export const STATE_DOWN_RESET = '3';
export const STATE_UP_RESET = '4';
export const STATE_PERIOD_RESET = '5';
export const INCEPTION_BLK = 7171376;

export const KOVAN_ACCOUNTS = [
	{
		address: '0x0022BFd6AFaD3408A1714fa8F9371ad5Ce8A0F1a',
		privateKey: '5e02a6a6b05fe971309cba0d0bd8f5e85f25e581d18f89eb0b6da753d18aa285'
	},
	{
		address: '0x00D8d0660b243452fC2f996A892D3083A903576F',
		privateKey: '16ea9a15dd4381a2ea9c41531fee530e6a78dadc1a86d3e64f207c35f4be1d17'
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
	'4': [0.35, 0.3, 0.25, 0.2],
	'3': [0.55, 0.45, 0.35],
	'2': [0.65, 0.5]
};
