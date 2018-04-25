import bitfinexTradeFeedUtil from './dataFetcher/bitfinex/bitfinexUtil';
import geminiTradeFeedUtil from './dataFetcher/gemini/geminiUtil';
import krankenTradeFeedUtil from './dataFetcher/kraken/krakenUtil';
import coinbaseGDAXTradeFeedUtil from './dataFetcher/gdax/gdaxUtil';
import calculatePrice from './priceCalculator/priceCalculatorUtil';
import pf from './priceSender/priceFeed';
import listenToAcceptPrice from './listenToAcceptPrice';
import parityAccount from './accounts/parityAccounts';
import contractRead from './utils/contractReader';
import decoder from './utils/inputDecoder';

const tool: string = process.argv[2];

switch (tool) {
	case 'pf':
		console.log('starting commitPrice process');
		pf.startFeeding();
		break;
	case 'acceptPrice':
		console.log('starting listening to acceptPrice event');
		listenToAcceptPrice.startListening();
		break;
	case 'createAccount':
		console.log('starting create accounts');
		const numOfAccounts: number = Number(process.argv[3]);
		parityAccount.createAccount(numOfAccounts);
		break;

	case 'removeAccount':
		const address: string = process.argv[3];
		parityAccount.removeAccount(address);
		break;
	case 'allAccounts':
		parityAccount.allAccountsInfo();
		break;
	case 'bitfinex':
		console.log('starting fetchTrade of bitfinex');
		bitfinexTradeFeedUtil.fetchETHTradesByOwnWebSocket();
		break;
	case 'gemini':
		console.log('starting fetchTrade of gemini');
		geminiTradeFeedUtil.fetchETHTradesByOwnWebSocket();
		break;
	case 'kraken':
		console.log('starting fetchTrade of kraken');
		krankenTradeFeedUtil.startFetching();
		break;

	case 'gdax':
		console.log('starting fetchTrade of gdax');
		coinbaseGDAXTradeFeedUtil.startFetching();
		break;
	case 'calculatePrice':
		console.log('starting calculate ETH price');
		calculatePrice.calculatePrice();
		break;
	case 'readContract':
		console.log('starting reading custodian contract state');
		const state: string = process.argv[3];
		contractRead.read(state);
		break;
	case 'decoder':
		console.log('starting decoding contract input');
		const input: string = process.argv[3];
		console.log(decoder.decode(input));
		break;
	default:
		console.log('no such tool ' + tool);
		break;
}
