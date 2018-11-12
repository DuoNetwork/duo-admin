import BeethovanWapper from '../../duo-contract-wrapper/src/BeethovanWapper';
import MagiWrapper from '../../duo-contract-wrapper/src/MagiWrapper';
import Web3Wrapper from '../../duo-contract-wrapper/src/Web3Wrapper';
import * as CST from './common/constants';
import dbUtil from './utils/dbUtil';
import eventUtil from './utils/eventUtil';
import keyUtil from './utils/keyUtil';
import marketUtil from './utils/marketUtil';
import priceUtil from './utils/priceUtil';
import util from './utils/util';

const tool = process.argv[2];
util.logInfo('tool ' + tool);
const option = util.parseOptions(process.argv);
util.logInfo(
	`using ${option.live ? 'live' : 'dev'}
	running on ${option.server ? 'server' : 'local'}
	using source ${option.source}
	using provider ${option.provider}`
);

const web3Wrapper = new Web3Wrapper(null, option.source, option.provider, option.live);
const beethovanWapper = new BeethovanWapper(web3Wrapper, option.live);
dbUtil.init(tool, option, web3Wrapper).then(() => {
	switch (tool) {
		case CST.TRADES:
			marketUtil.startFetching(tool, option);
			break;
		case CST.SUBSCRIBE:
			keyUtil.getKey(option).then(key => {
				eventUtil.subscribe(key.publicKey, key.privateKey, beethovanWapper, option);
			});
			break;
		case CST.COMMIT:
			util.logInfo('starting commit process');
			const magiWrapper = new MagiWrapper(web3Wrapper, option.live);
			keyUtil.getKey(option).then(key => {
				priceUtil.startCommitPrices(
					key.publicKey,
					key.privateKey,
					beethovanWapper,
					magiWrapper,
					option
				);
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
					web3Wrapper
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
