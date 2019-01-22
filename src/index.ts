// fix for @ledgerhq/hw-transport-u2f 4.28.0
import '@babel/polyfill';
import * as CST from './common/constants';
import ContractService from './services/ContractService';
import MarketDataService from './services/MarketDataService';
import priceUtil from './utils/priceUtil';
import util from './utils/util';

const tool = process.argv[2];
util.logInfo('tool ' + tool);
const option = util.parseOptions(process.argv);

if (!option.provider) {
	const infura = require('./keys/infura.json');
	option.provider =
		(option.live ? CST.PROVIDER_INFURA_MAIN : CST.PROVIDER_INFURA_KOVAN) + '/' + infura.token;
}

util.logInfo(
	`using ${option.live ? 'live' : 'dev'}
	running on ${option.server ? 'server' : 'local'}
	using source ${option.source}
	using provider ${option.provider}`
);

switch (tool) {
	case CST.TRADES:
		new MarketDataService(tool, option).startFetching(tool, option);
		break;
	case CST.FETCH_EVENTS:
		new ContractService(tool, option).fetchEvent();
		break;
	case CST.DB_PRICES:
		priceUtil.startAggregate(option.period);
		break;
	case CST.NODE:
		util.logInfo('starting node hear beat');
		new ContractService(tool, option).checkNodeStatus();
		break;
	case CST.CLEAN_DB:
		new MarketDataService(tool, option).cleanDb();
		break;
	case CST.START_CUSTODIAN:
		const kovanManagerAccount = require('./static/kovanManagerAccount.json');
		const optAddr = kovanManagerAccount.Beethoven.operator.address;
		new ContractService(tool, option).startCustodian(optAddr);
		break;
	case CST.TRIGGER:
		util.logInfo('starting trigger process');
		new ContractService(tool, option).trigger();
		break;
	case CST.COMMIT:
		util.logInfo('starting commit process');
		new ContractService(tool, option).commitPrice();
		break;
	case CST.FETCH_PRICE:
		util.logInfo('starting fetchPrice process');
		new ContractService(tool, option).fetchPrice();
		break;
	default:
		util.logInfo('no such tool ' + tool);
		break;
}
