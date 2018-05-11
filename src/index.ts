import bitfinexUtil from './apis/bitfinexUtil';
import geminiUtil from './apis/geminiUtil';
import krakenUtil from './apis/krakenUtil';
import gdaxUtil from './apis/gdaxUtil';
import calculator from './calculator';
import parityAccount from './accountUtil';
import ContractUtil from './contractUtil';
import eventUtil from './eventUtil';
import sqlUtil from './sqlUtil';
import * as CST from './constants';
import util from './util';

const tool = process.argv[2];
util.log('tool ' + tool);
const option = util.parseOptions(process.argv);
util.log('using ' + (option.live ? 'live' : 'dev') + ' env and ' + (option.source || 'local node'));
const contractUtil = new ContractUtil(option);

if (['bitfinex', 'gemini', 'kraken', 'gdax', 'commitPrice', 'calculatePrice'].includes(tool))
	sqlUtil.init(CST.DB_USER, option.pwd);

switch (tool) {
	case 'createAccount':
		util.log('starting create accounts');
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
		util.log('starting fetchTrade of bitfinex');
		bitfinexUtil.fetchTrades();
		break;
	case 'gemini':
		util.log('starting fetchTrade of gemini');
		geminiUtil.fetchTrades();
		break;
	case 'kraken':
		util.log('starting fetchTrade of kraken');
		krakenUtil.startFetching();
		break;
	case 'gdax':
		util.log('starting fetchTrade of gdax');
		gdaxUtil.startFetching();
		break;
	case 'calculatePrice':
		util.log('starting calculate ETH price');
		calculator.getPriceFix();
		break;
	case 'readContract':
		util.log('starting reading custodian contract state');
		const state: string = process.argv[3];
		contractUtil.read(state);
		break;
	case 'create':
		contractUtil.create(option);
		break;
	case 'decoder':
		util.log('starting decoding contract input');
		const input: string = process.argv[3];
		util.log(contractUtil.decode(input));
		break;
	case 'gasPrice':
		contractUtil.getGasPrice();
		break;
	case 'subscribe':
		eventUtil.subscribe(contractUtil, option);
		break;
	case 'commitPrice':
		util.log('starting commitPrice process');
		contractUtil.commitPrice(option);
		break;
	default:
		util.log('no such tool ' + tool);
		break;
}
