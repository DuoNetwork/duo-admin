import bitfinexUtil from './apis/bitfinexUtil';
import gdaxUtil from './apis/gdaxUtil';
import geminiUtil from './apis/geminiUtil';
import krakenUtil from './apis/krakenUtil';
import ContractUtil from './contractUtil';
import dbUtil from './dbUtil';
import eventUtil from './eventUtil';
import keyUtil from './keyUtil';
import ohlcUtil from './ohlcUtil';
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
const contractUtil = new ContractUtil(option);
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
				contractUtil.initKey(key);
				eventUtil.subscribe(contractUtil, option);
			});
			break;
		case 'commit':
			util.log('starting commit process');
			keyUtil.getKey(option).then(key => {
				contractUtil.initKey(key);
				contractUtil.commitPrice(option);
			});
			setInterval(() => dbUtil.insertHeartbeat(), 30000);
			break;
		case 'minutely':
			ohlcUtil.startProcessMinute(option);
			setInterval(() => dbUtil.insertHeartbeat(), 30000);
			break;
		case 'hourly':
			ohlcUtil.startProcessHour(option);
			setInterval(() => dbUtil.insertHeartbeat(), 30000);
			break;
		case 'node':
			util.log('starting node hear beat');
			setInterval(
				() =>
					contractUtil.getCurrentBlock().then(bn =>
						dbUtil.insertHeartbeat({
							block: { N: bn + '' }
						})
					),
				30000
			);
			break;
		default:
			util.log('no such tool ' + tool);
			break;
	}
});
