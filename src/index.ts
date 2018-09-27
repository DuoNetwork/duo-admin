import ContractUtil from '../../duo-contract-util/src/ContractUtil';
import bitfinexUtil from './apis/bitfinexUtil';
import gdaxUtil from './apis/gdaxUtil';
import geminiUtil from './apis/geminiUtil';
import krakenUtil from './apis/krakenUtil';
import dbUtil from './dbUtil';
import eventUtil from './eventUtil';
import keyUtil from './keyUtil';
import priceUtil from './priceUtil';
import util from './util';

const tool = process.argv[2];
util.log('tool ' + tool);
const option = util.parseOptions(process.argv);
util.log(
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
		case 'subscribe':
			keyUtil.getKey(option).then(key => {
				eventUtil.subscribe(key.publicKey, key.privateKey, contractUtil, option);
			});
			break;
		case 'commit':
			util.log('starting commit process');
			keyUtil.getKey(option).then(key => {
				priceUtil.startCommitPrices(key.publicKey, key.privateKey, contractUtil, option);
			});
			setInterval(() => dbUtil.insertHeartbeat(), 30000);
			break;
		case 'minutely':
			priceUtil.startProcessMinutelyPrices(option);
			setInterval(() => dbUtil.insertHeartbeat(), 30000);
			break;
		case 'hourly':
			priceUtil.startProcessHourlyPrices(option);
			setInterval(() => dbUtil.insertHeartbeat(), 30000);
			break;
		case 'node':
			util.log('starting node hear beat');
			setInterval(
				() =>
					contractUtil
						.getCurrentBlock()
						.then(bn =>
							dbUtil.insertHeartbeat({
								block: { N: bn + '' }
							})
						)
						.catch(error => util.log(error)),
				30000
			);
			break;
		case 'cleanDB':
			dbUtil.cleanDB();
			setInterval(() => dbUtil.cleanDB(), 60000 * 60 * 24);
			setInterval(() => dbUtil.insertHeartbeat(), 30000);
			break;
		default:
			util.log('no such tool ' + tool);
			break;
	}
});
