import * as Constants from '@finbook/duo-contract-wrapper/dist/constants';
import { kovan } from '@finbook/duo-contract-wrapper/dist/contractAddresses';
import dbUtil from '../utils/dbUtil';
import eventUtil from '../utils/eventUtil';
import keyUtil from '../utils/keyUtil';
import priceUtil from '../utils/priceUtil';
import ContractService from './ContractService';

const option = {
	forceREST: false,
	live: false,
	dbLive: false,
	server: false,
	dynamo: false,
	aws: false,
	gcp: false,
	azure: false,
	force: false,
	pair: 'pair',
	contractType: 'Beethoven',
	tenor: '100C-3H',
	assets: [''],
	sources: [''],
	exSources: [''],
	source: '',
	event: '',
	provider: '',
	period: 1
};

jest.mock('@finbook/duo-contract-wrapper', () => ({
	Constants: Constants,
	Web3Wrapper: jest.fn(() => ({
		web3: {
			eth: {
				accounts: {
					privateKeyToAccount: jest.fn(() => ({ address: '0xpublicKey' }))
				}
			}
		},
		contractAddresses: kovan
	})),
	DualClassWrapper: jest.fn(() => ({
		contract: 'dualClassWrapper'
	})),
	VivaldiWrapper: jest.fn(() => ({
		contract: 'VivaldiWrapper'
	})),
	EsplanadeWrapper: jest.fn(() => ({
		contract: 'EsplanadeWrapper'
	})),
	MagiWrapper: jest.fn(() => ({
		contract: 'MagiWrapper'
	}))
}));

import {
	DualClassWrapper,
	EsplanadeWrapper,
	MagiWrapper,
	Web3Wrapper
} from '@finbook/duo-contract-wrapper';
import util from '../utils/util';

const contractService = new ContractService('tool', {
	live: false,
	provider: 'provider',
	event: 'event',
	gasPrice: 1000000000,
	pair: 'quote|base',
	force: false,
	contractType: 'type',
	tenor: 'tenor'
} as any);

test('Web3Wrapper', () => {
	expect((Web3Wrapper as any).mock.calls).toMatchSnapshot();
});

test('createDuoWrappers', () => {
	expect(contractService.createDuoWrappers()).toMatchSnapshot();
	expect((DualClassWrapper as any).mock.calls).toMatchSnapshot();
});

test('createMagiWrapper', () => {
	expect(contractService.createMagiWrapper()).toMatchSnapshot();
	expect((MagiWrapper as any).mock.calls).toMatchSnapshot();
});

test('createEsplanadeWrapper', () => {
	expect(contractService.createEsplanadeWrapper()).toMatchSnapshot();
	expect((EsplanadeWrapper as any).mock.calls).toMatchSnapshot();
});

test('fetchKey', async () => {
	keyUtil.getKey = jest.fn(() =>
		Promise.resolve({
			privateKey: '0xprivateKey'
		} as any)
	);
	await contractService.fetchKey();
	expect((keyUtil.getKey as jest.Mock).mock.calls).toMatchSnapshot();
	expect(contractService.key).toMatchSnapshot();
	expect(contractService.address).toMatchSnapshot();
});

test('fetchKey, key not start with 0x', async () => {
	keyUtil.getKey = jest.fn(() =>
		Promise.resolve({
			privateKey: 'privateKey'
		} as any)
	);
	await contractService.fetchKey();
	expect((keyUtil.getKey as jest.Mock).mock.calls).toMatchSnapshot();
	expect(contractService.key).toMatchSnapshot();
	expect(contractService.address).toMatchSnapshot();
});

test('trigger', async () => {
	contractService.fetchKey = jest.fn();
	eventUtil.trigger = jest.fn();
	await contractService.trigger();
	expect((eventUtil.trigger as jest.Mock).mock.calls).toMatchSnapshot();
});

test('commitPrice', async () => {
	contractService.fetchKey = jest.fn();
	dbUtil.insertHeartbeat = jest.fn();
	priceUtil.startCommitPrices = jest.fn();
	global.setInterval = jest.fn();

	await contractService.commitPrice();
	expect((global.setInterval as jest.Mock).mock.calls[0][1]).toMatchSnapshot();
	(global.setInterval as jest.Mock).mock.calls[0][0]();
	expect(dbUtil.insertHeartbeat as jest.Mock).toBeCalledTimes(1);
	expect((priceUtil.startCommitPrices as jest.Mock).mock.calls).toMatchSnapshot();
});

test('fetchPrice', async () => {
	contractService.fetchKey = jest.fn();
	dbUtil.insertHeartbeat = jest.fn();
	priceUtil.fetchPrice = jest.fn();
	global.setInterval = jest.fn();

	await contractService.fetchPrice();
	expect((global.setInterval as jest.Mock).mock.calls[0][1]).toMatchSnapshot();
	(global.setInterval as jest.Mock).mock.calls[0][0]();
	expect(dbUtil.insertHeartbeat as jest.Mock).toBeCalledTimes(1);
	expect((priceUtil.fetchPrice as jest.Mock).mock.calls).toMatchSnapshot();
});

test('fetchEvent', async () => {
	eventUtil.fetch = jest.fn();
	contractService.createDuoWrappers = jest.fn(
		() =>
			({
				Beethoven: {
					Perpetual: 'BTV-PPT',
					M19: 'BTV-M19'
				},
				Mozart: {
					Perpetual: 'MZT-PPT',
					M19: 'MZT-M19'
				},
				Vivaldi: {
					tenor: 'VVD-tenor'
				}
			} as any)
	);
	await contractService.fetchEvent();
	expect((eventUtil.fetch as jest.Mock).mock.calls).toMatchSnapshot();
});

test('startCustodian, worng type', async () => {
	contractService.createDuoWrappers = jest.fn();
	await contractService.startCustodian(option as any);
	expect(contractService.createDuoWrappers as jest.Mock).not.toBeCalled();
});

test('startCustodian, dualClass', async () => {
	const contractService1 = new ContractService('tool', {
		live: false,
		provider: 'provider',
		event: 'event',
		gasPrice: 1000000000,
		gasLimit: 10000,
		pair: 'quote|base',
		contractType: 'Beethoven',
		tenor: 'Perpetual'
	} as any);
	const startCustodian = jest.fn();

	contractService1.createDuoWrappers = jest.fn(
		() =>
			({
				Beethoven: {
					Perpetual: {
						startCustodian: startCustodian,
						web3Wrapper: {
							contractAddresses: kovan
						}
					}
				}
			} as any)
	);
	await contractService1.startCustodian(option as any);
	expect((startCustodian as jest.Mock).mock.calls).toMatchSnapshot();
});

test('startCustodian, wrong type', async () => {
	const contractService1 = new ContractService('tool', {
		live: false,
		provider: 'provider',
		event: 'event',
		gasPrice: 1000000000,
		gasLimit: 10000,
		pair: 'quote|base',
		contractType: 'type',
		tenor: 'Perpetual'
	} as any);
	const startCustodian = jest.fn();

	contractService1.createDuoWrappers = jest.fn(
		() =>
			({
				Beethoven: {
					Perpetual: {
						startCustodian: startCustodian,
						web3Wrapper: {
							contractAddresses: kovan
						}
					}
				}
			} as any)
	);
	await contractService1.startCustodian(option as any);
	expect(startCustodian as jest.Mock).not.toBeCalled();
});

test('startCustodian, vivaldi', async () => {
	const option1 = ({
		live: false,
		provider: 'provider',
		event: 'event',
		gasPrice: 1000000000,
		gasLimit: 10000,
		pair: 'quote|base',
		contractType: 'Vivaldi',
		tenor: '100C-3H'
	} as any) as any;
	const contractService2 = new ContractService('tool', option1);
	const startCustodian = jest.fn();

	contractService2.createDuoWrappers = jest.fn(
		() =>
			({
				Vivaldi: {
					'100C-3H': {
						startCustodian: startCustodian,
						web3Wrapper: {
							contractAddresses: kovan
						}
					}
				}
			} as any)
	);
	await contractService2.startCustodian(option1);
	expect((startCustodian as jest.Mock).mock.calls).toMatchSnapshot();
});

test('checkRound, just started, startRound', async () => {
	util.getUTCNowTimestamp = jest.fn(() => 1200000000);
	const contractWrapper = {
		getStates: jest.fn(() =>
			Promise.resolve({
				lastPriceTime: 0,
				period: 100,
				state: 'Trading',
				resetPriceTime: 1000000000,
				priceFetchCoolDown: 0
			})
		),
		startRound: jest.fn()
	} as any;

	const magiWrapper = {
		getLastPrice: jest.fn(() =>
			Promise.resolve({
				timestamp: 1000000000,
				price: 100
			})
		)
	} as any;

	await contractService.checkRound(contractWrapper, magiWrapper);
	expect((contractWrapper.startRound as jest.Mock).mock.calls).toMatchSnapshot();
});

test('checkRound, skiped round', async () => {
	util.getUTCNowTimestamp = jest.fn(() => 1200000000);
	const contractWrapper = {
		getStates: jest.fn(() =>
			Promise.resolve({
				lastPriceTime: 1000000000,
				period: 100,
				state: 'Trading',
				resetPriceTime: 1000000000,
				priceFetchCoolDown: 0
			})
		)
	} as any;

	const magiWrapper = {
		getLastPrice: jest.fn(() =>
			Promise.resolve({
				timestamp: 1000000000,
				price: 100
			})
		)
	} as any;

	try {
		await contractService.checkRound(contractWrapper, magiWrapper);
	} catch (err) {
		expect(err).toMatchSnapshot();
	}
});

test('checkRound, state non trading', async () => {
	util.getUTCNowTimestamp = jest.fn(() => 1000000050);
	const contractWrapper = {
		getStates: jest.fn(() =>
			Promise.resolve({
				lastPriceTime: 1000000000,
				period: 100,
				state: 'Reset',
				resetPriceTime: 1000000000,
				priceFetchCoolDown: 0
			})
		),
		startRound: jest.fn(),
		endRound: jest.fn()
	} as any;

	const magiWrapper = {
		getLastPrice: jest.fn(() =>
			Promise.resolve({
				timestamp: 1000000000,
				price: 100
			})
		)
	} as any;

	await contractService.checkRound(contractWrapper, magiWrapper);
	expect(contractWrapper.startRound as jest.Mock).not.toBeCalled();
	expect(contractWrapper.endRound as jest.Mock).not.toBeCalled();
});

test('checkRound, startRound, priceFetchCoolDown = 0', async () => {
	util.getUTCNowTimestamp = jest.fn(() => 1000000050);
	const contractWrapper = {
		getStates: jest.fn(() =>
			Promise.resolve({
				lastPriceTime: 1000000000,
				period: 100,
				state: 'Trading',
				resetPriceTime: 1000000100,
				priceFetchCoolDown: 0
			})
		),
		startRound: jest.fn(),
		endRound: jest.fn()
	} as any;

	const magiWrapper = {
		getLastPrice: jest.fn(() =>
			Promise.resolve({
				timestamp: 1000000000,
				price: 100
			})
		)
	} as any;

	await contractService.checkRound(contractWrapper, magiWrapper);
	expect((contractWrapper.startRound as jest.Mock).mock.calls).toMatchSnapshot();
});

test('checkRound, startRound, priceFetchCoolDown > 0', async () => {
	util.getUTCNowTimestamp = jest.fn(() => 1000000251);
	const contractWrapper = {
		getStates: jest.fn(() =>
			Promise.resolve({
				lastPriceTime: 1000000060,
				period: 200,
				state: 'Trading',
				resetPriceTime: 1000000200,
				priceFetchCoolDown: 50
			})
		),
		startRound: jest.fn(),
		endRound: jest.fn()
	} as any;

	const magiWrapper = {
		getLastPrice: jest.fn(() =>
			Promise.resolve({
				timestamp: 1000000251,
				price: 100
			})
		)
	} as any;

	await contractService.checkRound(contractWrapper, magiWrapper);
	expect((contractWrapper.startRound as jest.Mock).mock.calls).toMatchSnapshot();
});

test('checkRound, startRound, priceFetchCoolDown > 0', async () => {
	util.getUTCNowTimestamp = jest.fn(() => 1000000251);
	const contractWrapper = {
		getStates: jest.fn(() =>
			Promise.resolve({
				lastPriceTime: 1000000060,
				period: 200,
				state: 'Trading',
				resetPriceTime: 1000000200,
				priceFetchCoolDown: 50
			})
		),
		startRound: jest.fn(),
		endRound: jest.fn()
	} as any;

	const magiWrapper = {
		getLastPrice: jest.fn(() =>
			Promise.resolve({
				timestamp: 1000000249,
				price: 100
			})
		)
	} as any;

	await contractService.checkRound(contractWrapper, magiWrapper);
	expect(contractWrapper.startRound as jest.Mock).not.toBeCalled();
});

test('checkRound, endRound', async () => {
	util.getUTCNowTimestamp = jest.fn(() => 1000000100);
	const contractWrapper = {
		getStates: jest.fn(() =>
			Promise.resolve({
				lastPriceTime: 1000000060,
				period: 100,
				state: 'Trading',
				resetPriceTime: 1000000000,
				priceFetchCoolDown: 50
			})
		),
		startRound: jest.fn(),
		endRound: jest.fn()
	} as any;

	const magiWrapper = {
		getLastPrice: jest.fn(() =>
			Promise.resolve({
				timestamp: 1000000100,
				price: 100
			})
		)
	} as any;

	await contractService.checkRound(contractWrapper, magiWrapper);
	expect(contractWrapper.startRound as jest.Mock).not.toBeCalled();
	expect((contractWrapper.endRound as jest.Mock).mock.calls).toMatchSnapshot();
});

test('checkRound, endRound, time too early', async () => {
	util.getUTCNowTimestamp = jest.fn(() => 1000000100);
	const contractWrapper = {
		getStates: jest.fn(() =>
			Promise.resolve({
				lastPriceTime: 1000000060,
				period: 100,
				state: 'Trading',
				resetPriceTime: 1000000000,
				priceFetchCoolDown: 50
			})
		),
		startRound: jest.fn(),
		endRound: jest.fn()
	} as any;

	const magiWrapper = {
		getLastPrice: jest.fn(() =>
			Promise.resolve({
				timestamp: 1000000090,
				price: 100
			})
		)
	} as any;

	await contractService.checkRound(contractWrapper, magiWrapper);
	expect(contractWrapper.startRound as jest.Mock).not.toBeCalled();
	expect(contractWrapper.endRound as jest.Mock).not.toBeCalled();
});

test('round', async () => {
	contractService.fetchKey = jest.fn();
	contractService.createDuoWrappers = jest.fn(
		() =>
			({
				Beethoven: {
					Perpetual: 'BTV-PPT-Wrapper',
					M19: 'BTV-M19-Wrapper'
				},
				Mozart: {
					Perpetual: 'MZT-PPT-Wrapper',
					M19: 'MZT-M19-Wrapper'
				},
				Vivaldi: {
					'100C-3H': '100C-3H-Wrapper'
				}
			} as any)
	);

	contractService.createMagiWrapper = jest.fn(() => 'magiWrapper' as any);
	contractService.checkRound = jest.fn(() => Promise.resolve(undefined));
	global.setInterval = jest.fn();

	await contractService.round({ contractType: 'Vivaldi', tenor: '100C-3H' } as any);
	expect((contractService.checkRound as jest.Mock).mock.calls).toMatchSnapshot();
	expect((global.setInterval as jest.Mock).mock.calls).toMatchSnapshot();

	(global.setInterval as jest.Mock).mock.calls[0][0]();
	expect(contractService.checkRound as jest.Mock).toBeCalledTimes(2);
});
