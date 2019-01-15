// fix for @ledgerhq/hw-transport-u2f 4.28.0
import '@babel/polyfill';
import DualClassWrapper from '../../duo-contract-wrapper/src/DualClassWrapper';
import EsplanadeWrapper from '../../duo-contract-wrapper/src/EsplanadeWrapper';
import MagiWrapper from '../../duo-contract-wrapper/src/MagiWrapper';
import { ICustodianWrappers } from '../../duo-contract-wrapper/src/types';
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

if (!option.provider)
	if (option.source === CST.SRC_INFURA) {
		const infura = require('./keys/infura.json');
		option.provider =
			(option.live ? CST.PROVIDER_INFURA_MAIN : CST.PROVIDER_INFURA_KOVAN) +
			'/' +
			infura.token;
	}

util.logInfo(
	`using ${option.live ? 'live' : 'dev'}
	running on ${option.server ? 'server' : 'local'}
	using source ${option.source}
	using provider ${option.provider}`
);

const initContracts = (provider: string, privateKey: string, live: boolean) => {
	console.log('start initializing');
	const web3wrapper = new Web3Wrapper(null, provider, privateKey, live);

	const dualClassWrappers: ICustodianWrappers = {
		Beethoven: {
			Perpetual: new DualClassWrapper(
				web3wrapper,
				web3wrapper.contractAddresses.Custodians.Beethoven.Perpetual.custodian.address
			),
			M19: new DualClassWrapper(
				web3wrapper,
				web3wrapper.contractAddresses.Custodians.Beethoven.M19.custodian.address
			)
		},
		Mozart: {
			Perpetual: new DualClassWrapper(
				web3wrapper,
				web3wrapper.contractAddresses.Custodians.Mozart.Perpetual.custodian.address
			),
			M19: new DualClassWrapper(
				web3wrapper,
				web3wrapper.contractAddresses.Custodians.Mozart.M19.custodian.address
			)
		}
	};
	console.log('end initializing');
	return dualClassWrappers;
};

let dualClassCustodianWrappers = initContracts(option.provider, '', option.live);
const web3Wrapper = dualClassCustodianWrappers.Beethoven.Perpetual.web3Wrapper;

let magiWrapper = new MagiWrapper(web3Wrapper, web3Wrapper.contractAddresses.Oracles[0].address);
const esplanadeWrapper = new EsplanadeWrapper(
	web3Wrapper,
	web3Wrapper.contractAddresses.MultiSigManagers[0].address
);

// 'df2fe188d10c269022626e0260b8630562166dd310217faf137a884912420292';
// 'bota botb botc botd bote botf botg both boti botj botk botl';
// dbUtil.init(tool, option, web3Wrapper).then(() => {
switch (tool) {
	case CST.TRADES:
		marketUtil.startFetching(tool, option);
		break;
	case CST.TRIGGER:
		// keyUtil.getKey(option).then(key => {
		const privateKey = 'df2fe188d10c269022626e0260b8630562166dd310217faf137a884912420292';
		dualClassCustodianWrappers = initContracts(option.provider, privateKey, option.live);
		console.log('start triggering');
		eventUtil.trigger(
			[
				dualClassCustodianWrappers.Beethoven.Perpetual,
				dualClassCustodianWrappers.Beethoven.M19,
				dualClassCustodianWrappers.Mozart.Perpetual,
				dualClassCustodianWrappers.Mozart.M19
			],
			option
		);
		// });
		break;
	case CST.FETCH_EVENTS:
		eventUtil.fetch(
			[
				dualClassCustodianWrappers.Beethoven.Perpetual,
				dualClassCustodianWrappers.Beethoven.M19,
				dualClassCustodianWrappers.Mozart.Perpetual,
				dualClassCustodianWrappers.Mozart.M19,
				magiWrapper,
				esplanadeWrapper
			],
			option.force
		);
		break;
	case CST.COMMIT:
		util.logInfo('starting commit process');

		keyUtil.getKey(option).then(key => {
			dualClassCustodianWrappers = initContracts(
				option.provider,
				key.privateKey,
				option.live
			);
			magiWrapper = new MagiWrapper(
				dualClassCustodianWrappers.Beethoven.Perpetual.web3Wrapper,
				dualClassCustodianWrappers.Beethoven.Perpetual.web3Wrapper.contractAddresses.Oracles[0].address
			);
			priceUtil.startCommitPrices(magiWrapper, option);
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
					.getCurrentBlockNumber()
					.then(bn =>
						dbUtil.insertHeartbeat({
							block: { N: bn + '' }
						})
					)
					.catch(error => util.logInfo(error)),
			30000
		);
		break;
	case CST.FETCH_PRICE:
		util.logInfo('starting fetchPrice process');
		keyUtil.getKey(option).then(key => {
			dualClassCustodianWrappers = initContracts(
				option.provider,
				key.privateKey,
				option.live
			);
			magiWrapper = new MagiWrapper(
				dualClassCustodianWrappers.Beethoven.Perpetual.web3Wrapper,
				dualClassCustodianWrappers.Beethoven.Perpetual.web3Wrapper.contractAddresses.Oracles[0].address
			);
			priceUtil.fetchPrice(
				[
					dualClassCustodianWrappers.Beethoven.Perpetual,
					dualClassCustodianWrappers.Beethoven.M19,
					dualClassCustodianWrappers.Mozart.Perpetual,
					dualClassCustodianWrappers.Mozart.M19
				],
				magiWrapper,
				option
			);
		});
		setInterval(() => dbUtil.insertHeartbeat(), 30000);
		break;
	case CST.CLEAN_DB:
		dbUtil.cleanDB();
		setInterval(() => dbUtil.cleanDB(), 60000 * 60 * 24);
		setInterval(() => dbUtil.insertHeartbeat(), 30000);
		break;
	case CST.START_CUSTODIAN:
		const kovanManagerAccount = require('./static/kovanManagerAccount.json');
		const type = option.contractType;
		const tenor = option.tenor;
		if (
			![CST.BEETHOVEN, CST.MOZART].includes(type) ||
			![CST.TENOR_PPT, CST.TENOR_M19].includes(tenor)
		) {
			util.logDebug('no contract type or tenor specified');
			break;
		}
		const contractWrapper: DualClassWrapper = dualClassCustodianWrappers[type][tenor];

		contractWrapper.startCustodianRaw(
			kovanManagerAccount.Beethoven.operator.address,
			kovanManagerAccount.Beethoven.operator.privateKey,
			contractWrapper.web3Wrapper.contractAddresses.Custodians[type][tenor].aToken.address,
			contractWrapper.web3Wrapper.contractAddresses.Custodians[type][tenor].bToken.address,
			contractWrapper.web3Wrapper.contractAddresses.Oracles[0].address,
			option.gasPrice || 2000000000,
			option.gasLimit || 1000000
		);
		break;
	default:
		util.logInfo('no such tool ' + tool);
		break;
}
// });
