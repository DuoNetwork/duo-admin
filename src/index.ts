import Web3 from 'web3';
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

const live = process.argv.includes('live');
util.log('using ' + (live ? 'live' : 'dev') + ' env');

const option = util.parseOptions(process.argv);

let providerUrl = 'ws://localhost:8546';
if (option.source === 'myether') {
	providerUrl = live ? 'https://api.myetherapi.com/eth' : 'https://api.myetherapi.com/rop';
} else if (option.source === 'infura') {
	providerUrl = live
		? 'https://mainnet.infura.io/WSDscoNUvMiL1M7TvMNP'
		: 'https://kovan.infura.io/WSDscoNUvMiL1M7TvMNP';
}

util.log('using ' + (option.source || 'local node'));

const web3 = new Web3(
	option.source
		? new Web3.providers.HttpProvider(providerUrl)
		: new Web3.providers.WebsocketProvider(providerUrl)
);

const contractUtil = new ContractUtil(web3);

if (['bitfinex', 'gemini', 'kraken', 'gdax', 'pf', 'calculatePrice'].includes(tool))
	sqlUtil.init(CST.DB_USER, option.pwd);

switch (tool) {
	case 'pf':
		util.log('starting commitPrice process');
		contractUtil.commitPrice(option);
		break;
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
	default:
		util.log('no such tool ' + tool);
		break;
}
