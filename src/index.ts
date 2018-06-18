import bitfinexUtil from './apis/bitfinexUtil';
import gdaxUtil from './apis/gdaxUtil';
import geminiUtil from './apis/geminiUtil';
import krakenUtil from './apis/krakenUtil';
import ContractUtil from './contractUtil';
import dynamoUtil from './database/dynamoUtil';
import sqlUtil from './database/sqlUtil';
import dbUtil from './dbUtil';
import eventUtil from './eventUtil';
import ohlcUtil from './ohlcUtil';
import storageUtil from './storageUtil';
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

dbUtil.init(option.dynamo);
dynamoUtil.init(
	option.live,
	util.getDynamoRole(tool, option.dynamo),
	util.getStatusProcess(tool, option)
);
console.log(util.getDynamoRole(tool, option.dynamo));
console.log(util.getStatusProcess(tool, option));
if (['bitfinex', 'gemini', 'kraken', 'gdax', 'commit'].includes(tool) && !option.dynamo)
	storageUtil
		.getSqlAuth(option)
		.then(sqlAuth => sqlUtil.init(sqlAuth.host, sqlAuth.user, sqlAuth.password));

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
		storageUtil.getKey(option).then(key => {
			const contractUtil = new ContractUtil(option, key);
			eventUtil.subscribe(contractUtil, option);
		});
		break;
	case 'commit':
		util.log('starting commit process');
		storageUtil.getKey(option).then(key => {
			const contractUtil = new ContractUtil(option, key);
			contractUtil.commitPrice(option);
		});
		setInterval(() => dynamoUtil.insertHeartbeat(), 30000);
		break;
	case 'minutely':
		ohlcUtil.startProcessMinute(option);
		setInterval(() => dynamoUtil.insertHeartbeat(), 30000);
		break;
	case 'hourly':
		ohlcUtil.startProcessHour(option);
		setInterval(() => dynamoUtil.insertHeartbeat(), 30000);
		break;
	// case 'redeem':
	// 	contractUtil.create(
	// 		option.address,
	// 		option.privateKey,
	// 		optiongasPrice,
	// 		gasLimit: number,
	// 		eth: number,
	// 		nonce: number = -1
	// 	)
	case 'getKey':
		if (option.aws)
			storageUtil.getAWSkey(option.key).then(data => {
				console.log(JSON.parse(data.object.Parameter.Value));
			});
		else if (option.azure)
			storageUtil.getAZUREkey(option.key).then(data => {
				console.log(JSON.parse(data));
			});
		else if (option.gcp)
			storageUtil.getGCPkey(option.key).then(data => {
				console.log(JSON.parse(data));
			});

		break;
	case 'node':
		util.log('starting node hear beat');
		storageUtil.getKey(option).then(key => {
			const contractUtil = new ContractUtil(option, key);
			setInterval(
				() =>
					contractUtil.getCurrentBlock().then(bn =>
						dynamoUtil.insertHeartbeat({
							block: { N: bn + '' }
						})
					),
				30000
			);
		});
		break;
	default:
		util.log('no such tool ' + tool);
		break;
}
