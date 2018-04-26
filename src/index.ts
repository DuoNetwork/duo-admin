import bitfinexUtil from './apis/bitfinexUtil';
import geminiUtil from './apis/geminiUtil';
import krakenUtil from './apis/krakenUtil';
import gdaxUtil from './apis/gdaxUtil';
import calculatePrice from './calculator';
import parityAccount from './accountUtil';
import contractUtil from './contractUtil';
import sqlUtil from './sqlUtil';
import * as CST from './constants';

const tool: string = process.argv[2];

if (['bitfinex', 'gemini', 'kraken', 'gdax', 'pf', 'calculatePrice'].includes(tool))
	sqlUtil.init(CST.DB_USER, CST.DB_PASSWORD);

switch (tool) {
	case 'pf':
		console.log('starting commitPrice process');
		contractUtil.commitPrice(process.argv);
		break;
	case 'acceptPrice':
		console.log('starting listening to acceptPrice event');
		contractUtil.subscribeAcceptPriceEvent();
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
		bitfinexUtil.fetchTrades();
		break;
	case 'gemini':
		console.log('starting fetchTrade of gemini');
		geminiUtil.fetchTrades();
		break;
	case 'kraken':
		console.log('starting fetchTrade of kraken');
		krakenUtil.startFetching();
		break;

	case 'gdax':
		console.log('starting fetchTrade of gdax');
		gdaxUtil.startFetching();
		break;
	case 'calculatePrice':
		console.log('starting calculate ETH price');
		calculatePrice.calculatePrice();
		break;
	case 'readContract':
		console.log('starting reading custodian contract state');
		const state: string = process.argv[3];
		contractUtil.read(state);
		break;
	case 'decoder':
		console.log('starting decoding contract input');
		const input: string = process.argv[3];
		console.log(contractUtil.decode(input));
		break;
	default:
		console.log('no such tool ' + tool);
		break;
}
