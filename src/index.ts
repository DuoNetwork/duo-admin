// fix for @ledgerhq/hw-transport-u2f 4.28.0
import '@babel/polyfill';
import { Constants } from '@finbook/duo-contract-wrapper';
import * as CST from './common/constants';
import ContractService from './services/ContractService';
import MarketDataService from './services/MarketDataService';
import util from './utils/util';

const tool = process.argv[2];
util.logInfo('tool ' + tool);
const option = util.parseOptions(process.argv);

if (!option.provider) {
	const infura = require('./keys/infura.json');
	option.provider =
		(option.live ? Constants.PROVIDER_INFURA_MAIN : Constants.PROVIDER_INFURA_KOVAN) +
		'/' +
		infura.token;
}

util.logInfo(
	`using ${option.live ? 'live' : 'dev'}
	running on ${option.server ? 'server' : 'local'}
	using source ${option.source}
	using provider ${option.provider}`
);

switch (tool) {
	case CST.TRADES:
		const tradeMds = new MarketDataService(tool, option);
		tradeMds.init().then(() => tradeMds.startFetching(tool, option));
		break;
	case CST.FETCH_EVENTS:
		const eventCs = new ContractService(tool, option);
		eventCs.init().then(() => eventCs.fetchEvent());
		break;
	case CST.DB_PRICES:
		const priceMds = new MarketDataService(tool, option);
		priceMds.init().then(() => priceMds.startAggregate(option.period));
		break;
	case CST.CLEAN_DB:
		const dbMds = new MarketDataService(tool, option);
		dbMds.init().then(() => dbMds.cleanDb());
		break;
	case CST.START_CUSTODIAN:
		const startCs = new ContractService(tool, option);
		startCs.init().then(() => startCs.startCustodian());
		break;
	case CST.TRIGGER:
		const triggerCs = new ContractService(tool, option);
		triggerCs.init().then(() => triggerCs.trigger());
		break;
	case CST.COMMIT:
		const commitCs = new ContractService(tool, option);
		commitCs.init().then(() => commitCs.commitPrice());
		break;
	case CST.FETCH_PRICE:
		const fetchCs = new ContractService(tool, option);
		fetchCs.init().then(() => fetchCs.fetchPrice());
		break;
	default:
		util.logInfo('no such tool ' + tool);
		break;
}
