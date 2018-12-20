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

let infura = {
	token: '',
};

try {
	infura = require('./keys/infura.json');
} catch (e) {
	console.log(e)
}

if (!option.provider) {
	if (option.source === CST.SRC_INFURA && !option.ws)
		option.provider =
			(option.live ? CST.PROVIDER_INFURA_MAIN : CST.PROVIDER_INFURA_KOVAN) +
			'/' +
			infura.token;
	else option.provider = option.live ? CST.PROVIDER_INFURA_MAIN_WS : CST.PROVIDER_INFURA_KOVAN_WS;
}

util.logInfo(
	`using ${option.live ? 'live' : 'dev'}
	running on ${option.server ? 'server' : 'local'}
	using source ${option.source}
	using provider ${option.provider}`
);

const web3Wrapper = new Web3Wrapper(null, option.source, option.provider, option.live);

const dualClassCustodianWrappers: ICustodianWrappers = {
	Beethoven: {
		Perpetual: new DualClassWrapper(
			web3Wrapper,
			web3Wrapper.contractAddresses.Custodians.Beethoven.Perpetual.custodian.address
		),
		M19: new DualClassWrapper(
			web3Wrapper,
			web3Wrapper.contractAddresses.Custodians.Beethoven.M19.custodian.address
		)
	},
	Mozart: {
		Perpetual: new DualClassWrapper(
			web3Wrapper,
			web3Wrapper.contractAddresses.Custodians.Mozart.Perpetual.custodian.address
		),
		M19: new DualClassWrapper(
			web3Wrapper,
			web3Wrapper.contractAddresses.Custodians.Mozart.M19.custodian.address
		)
	}
};

const magiWrapper = new MagiWrapper(web3Wrapper, web3Wrapper.contractAddresses.Oracles[0].address);
const esplanadeWrapper = new EsplanadeWrapper(
	web3Wrapper,
	web3Wrapper.contractAddresses.MultiSigManagers[0].address
);
dbUtil.init(tool, option, web3Wrapper).then(() => {
	switch (tool) {
		case CST.TRADES:
			marketUtil.startFetching(tool, option);
			break;
		case CST.TRIGGER:
			keyUtil.getKey(option).then(key => {
				eventUtil.trigger(
					key.publicKey,
					key.privateKey,
					[
						dualClassCustodianWrappers.Beethoven.Perpetual,
						dualClassCustodianWrappers.Beethoven.M19,
						dualClassCustodianWrappers.Mozart.Perpetual,
						dualClassCustodianWrappers.Mozart.M19
					],
					option
				);
			});
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
				priceUtil.startCommitPrices(key.publicKey, key.privateKey, magiWrapper, option);
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
				priceUtil.fetchPrice(
					key.publicKey,
					key.privateKey,
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
				return;
			}
			const contractWrapper: DualClassWrapper =
				dualClassCustodianWrappers[type][tenor];

			contractWrapper.startCustodianRaw(
				kovanManagerAccount.Beethoven.operator.address,
				kovanManagerAccount.Beethoven.operator.privateKey,
				contractWrapper.web3Wrapper.contractAddresses.Custodians[type][tenor].aToken
					.address,
				contractWrapper.web3Wrapper.contractAddresses.Custodians[type][tenor].bToken
					.address,
				contractWrapper.web3Wrapper.contractAddresses.Oracles[0].address,
				option.gasPrice || 2000000000,
				option.gasLimit || 1000000
			);
			break;
		default:
			util.logInfo('no such tool ' + tool);
			break;
	}
});
