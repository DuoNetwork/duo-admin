// fix for @ledgerhq/hw-transport-u2f 4.28.0
import '@babel/polyfill';
import { Constants as WrapperConstants } from '@finbook/duo-contract-wrapper';
import { Constants as DataConstants } from '@finbook/duo-market-data';
import * as CST from './common/constants';
import ContractService from './services/ContractService';
import MarketDataService from './services/MarketDataService';
import dbUtil from './utils/dbUtil';
import util from './utils/util';

const tool = process.argv[2];
util.logInfo('tool ' + tool);
const option = util.parseOptions(process.argv);

if (!option.provider) {
	const infura = require('./keys/infura.json');
	option.provider =
		(option.live
			? WrapperConstants.PROVIDER_INFURA_MAIN
			: WrapperConstants.PROVIDER_INFURA_KOVAN) +
		'/' +
		infura.token;
}

util.logInfo(
	`using ${option.live ? 'live' : 'dev'}
	running on ${option.server ? 'server' : 'local'}
	using source ${option.source}
	using provider ${option.provider}`
);

dbUtil.init(tool, option).then(() => {
	switch (tool) {
		case CST.TRADES:
			new MarketDataService().startFetching(tool, option);
			break;
		case CST.EVENTS:
			new MarketDataService().startFetchingEvent(tool, option);
			break;
		case DataConstants.DB_PRICES:
			new MarketDataService().startAggregate(option.period);
			break;
		case CST.CLEAN_DB:
			new MarketDataService().cleanDb();
			break;
		case CST.START_CUSTODIAN:
			new ContractService(tool, option).startCustodian(option);
			break;
		case CST.COMMIT:
			new ContractService(tool, option).commitPrice();
			break;
		case CST.FETCH_PRICE:
			new ContractService(tool, option).fetchPrice();
			break;
		case CST.ROUND:
			new ContractService(tool, option).round(option);
			break;
		default:
			util.logInfo('no such tool ' + tool);
			break;
	}
});
