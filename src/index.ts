import parityAccount from './accountUtil';
import bitfinexUtil from './apis/bitfinexUtil';
import gdaxUtil from './apis/gdaxUtil';
import geminiUtil from './apis/geminiUtil';
import krakenUtil from './apis/krakenUtil';
import calculator from './calculator';
import * as CST from './constants';
import ContractUtil from './contractUtil';
import dbUtil from './dbUtil';
import eventUtil from './eventUtil';
import util from './util';

const tool = process.argv[2];
util.log('tool ' + tool);
const option = util.parseOptions(process.argv);
util.log('using ' + (option.live ? 'live' : 'dev') + ' env and ' + (option.source || 'local node'));
const contractUtil = new ContractUtil(option);

if (['bitfinex', 'gemini', 'kraken', 'gdax', 'commitPrice', 'calculatePrice'].includes(tool))
	dbUtil.init(option.aws, CST.DB_USER, option.pwd);

switch (tool) {
	case 'createAccount':
		util.log('starting create accounts');
		parityAccount.createAccount(contractUtil, option);
		break;
	case 'accountsInfo':
		parityAccount.allAccountsInfo(contractUtil);
		break;
	case 'fuelAccounts':
		parityAccount.fuelAccounts(contractUtil, option);
		break;
	case 'collectEther':
		parityAccount.collectEther(contractUtil, option);
		break;
	case 'makeCreation':
		parityAccount.makeCreation(contractUtil, option);
		break;
	case 'makeRedemption':
		parityAccount.makeRedemption(contractUtil);
		break;
	case 'makeTokenTransfer':
		parityAccount.makeTokenTransfer(contractUtil);
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
		if (option.contractState === 'userBalance') contractUtil.readUserBalance(option);
		else if (option.contractState === 'systemStates') contractUtil.readSysStates();
		else contractUtil.read(option.contractState);

		break;
	case 'create':
		contractUtil.create(
			option.address,
			option.privateKey,
			option.gasPrice,
			option.gasLimit,
			option.eth
		);
		break;
	case 'redeem':
		contractUtil.redeem(
			option.address,
			option.privateKey,
			option.amtA,
			option.amtB,
			option.gasPrice,
			option.gasLimit
		);
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
