import ContractUtil from '../../duo-contract-util/src/contractUtil';
import * as CST from './constants';
import dbUtil from './dbUtil';
import eventUtil from './eventUtil';
import keyUtil from './keyUtil';
import marketUtil from './marketUtil';
import priceUtil from './priceUtil';
import util from './util';

const tool = process.argv[2];
util.logInfo('tool ' + tool);
const option = util.parseOptions(process.argv);
util.logInfo(
	'using ' +
		(option.live ? 'live' : 'dev') +
		'running on ' +
		(option.server ? 'server' : 'local') +
		' env and ' +
		(option.source || 'local node')
);
const contractUtil = new ContractUtil(null, option.source, option.provider, option.live);
dbUtil.init(tool, option).then(() => {
	switch (tool) {
		case CST.TRADES:
			marketUtil.startFetching(tool, option);
			break;
		case CST.SUBSCRIBE:
			keyUtil.getKey(option).then(key => {
				eventUtil.subscribe(key.publicKey, key.privateKey, contractUtil, option);
			});
			break;
		case CST.COMMIT:
			util.logInfo('starting commit process');
			keyUtil.getKey(option).then(key => {
				priceUtil.startCommitPrices(key.publicKey, key.privateKey, contractUtil, option);
			});
			setInterval(() => dbUtil.insertHeartbeat(), 30000);
			break;
		case CST.DB_PRICES:
			priceUtil.startAggregate(option.period);
			break;
		case CST.NODE:
			util.logInfo('starting node hear beat');
			setInterval(
				() =>
					contractUtil
						.getCurrentBlock()
						.then(bn =>
							dbUtil.insertHeartbeat({
								block: { N: bn + '' }
							})
						)
						.catch(error => util.logInfo(error)),
				30000
			);
			break;
		case CST.CLEAN_DB:
			dbUtil.cleanDB();
			setInterval(() => dbUtil.cleanDB(), 60000 * 60 * 24);
			setInterval(() => dbUtil.insertHeartbeat(), 30000);
			break;
		default:
			util.logInfo('no such tool ' + tool);
			break;
	}
});
