import { kovan } from '../../../duo-contract-wrapper/src/contractAddresses';
import Web3Wrapper from '../../../duo-contract-wrapper/src/Web3Wrapper';
import dynamoUtil from './dynamoUtil';
import eventUtil from './eventUtil';

jest.mock('../../../duo-contract-wrapper/src/DualClassWrapper', () =>
	jest.fn(() => ({
		contract: 'dualClassWrapper'
	}))
);

jest.mock('../../../duo-contract-wrapper/src/Web3Wrapper', () =>
	jest.fn(() => ({
		contractAddresses: kovan
	}))
);

test('trigger, worng event name', async () => {
	dynamoUtil.insertHeartbeat = jest.fn();
	global.setInterval = jest.fn();
	const dualClassWrapper = {
		address: 'contractAddress',
		getStates: jest.fn(() =>
			Promise.resolve({
				state: 'state'
			})
		),
		triggerPreReset: jest.fn(),
		triggerReset: jest.fn()
	} as any;
	await eventUtil.trigger('account', [dualClassWrapper], 'event');
	expect(global.setInterval as jest.Mock).not.toBeCalled();
	expect(dynamoUtil.insertHeartbeat as jest.Mock).not.toBeCalled();
});

test('trigger, StartPreReset', async () => {
	dynamoUtil.insertHeartbeat = jest.fn();
	global.setInterval = jest.fn();
	const dualClassWrappers = [
		{
			address: 'contractAddress1',
			getStates: jest.fn(() =>
				Promise.resolve({
					state: 'PreReset'
				})
			),
			triggerPreReset: jest.fn(),
			triggerReset: jest.fn()
		} as any,
		{
			address: 'contractAddress2',
			getStates: jest.fn(() =>
				Promise.resolve({
					state: 'PreReset'
				})
			),
			triggerPreReset: jest.fn(),
			triggerReset: jest.fn()
		} as any
	];
	await eventUtil.trigger('account', dualClassWrappers, 'StartPreReset');
	expect((global.setInterval as jest.Mock).mock.calls[0][1]).toMatchSnapshot();
	await (global.setInterval as jest.Mock).mock.calls[0][0]();

	for (const dcw of dualClassWrappers) {
		expect(dcw.getStates as jest.Mock).toBeCalledTimes(1);
		expect((dcw.triggerPreReset as jest.Mock).mock.calls).toMatchSnapshot();
		expect(dcw.triggerReset as jest.Mock).not.toBeCalled();
	}
	expect(dynamoUtil.insertHeartbeat as jest.Mock).toBeCalledTimes(dualClassWrappers.length);
});

test('trigger, StartReset', async () => {
	dynamoUtil.insertHeartbeat = jest.fn();
	global.setInterval = jest.fn();
	const dualClassWrappers = [
		{
			address: 'contractAddress1',
			getStates: jest.fn(() =>
				Promise.resolve({
					state: 'Reset'
				})
			),
			triggerPreReset: jest.fn(() => Promise.resolve()),
			triggerReset: jest.fn(() => Promise.resolve())
		} as any,
		{
			address: 'contractAddress2',
			getStates: jest.fn(() =>
				Promise.resolve({
					state: 'Reset'
				})
			),
			triggerPreReset: jest.fn(() => Promise.resolve()),
			triggerReset: jest.fn(() => Promise.resolve())
		} as any
	];
	await eventUtil.trigger('account', dualClassWrappers, 'StartReset');
	expect((global.setInterval as jest.Mock).mock.calls[0][1]).toMatchSnapshot();
	await (global.setInterval as jest.Mock).mock.calls[0][0]();

	for (const dcw of dualClassWrappers) {
		expect(dcw.getStates as jest.Mock).toBeCalledTimes(1);
		expect((dcw.triggerReset as jest.Mock).mock.calls).toMatchSnapshot();
		expect(dcw.triggerPreReset as jest.Mock).not.toBeCalled();
	}
	expect(dynamoUtil.insertHeartbeat as jest.Mock).toBeCalledTimes(dualClassWrappers.length);
});

test('trigger, StartReset, wrong state', async () => {
	dynamoUtil.insertHeartbeat = jest.fn();
	global.setInterval = jest.fn();
	const dualClassWrappers = [
		{
			address: 'contractAddress1',
			getStates: jest.fn(() =>
				Promise.resolve({
					state: 'state'
				})
			),
			triggerPreReset: jest.fn(() => Promise.resolve()),
			triggerReset: jest.fn(() => Promise.resolve())
		} as any,
		{
			address: 'contractAddress2',
			getStates: jest.fn(() =>
				Promise.resolve({
					state: 'state'
				})
			),
			triggerPreReset: jest.fn(() => Promise.resolve()),
			triggerReset: jest.fn(() => Promise.resolve())
		} as any
	];
	await eventUtil.trigger('account', dualClassWrappers, 'StartReset');
	expect((global.setInterval as jest.Mock).mock.calls[0][1]).toMatchSnapshot();
	await (global.setInterval as jest.Mock).mock.calls[0][0]();

	for (const dcw of dualClassWrappers) {
		expect(dcw.getStates as jest.Mock).toBeCalledTimes(1);
		expect(dcw.triggerReset as jest.Mock).not.toBeCalled();
		expect(dcw.triggerPreReset as jest.Mock).not.toBeCalled();
	}
	expect(dynamoUtil.insertHeartbeat as jest.Mock).toBeCalledTimes(dualClassWrappers.length);
});

const contractEvents: { [contract: string]: { [event: string]: object } } = {
	contract1: {
		event1: {
			event: 'event1',
			address: 'contract1',
			returnValues: {
				address: 'address1',
				event: 'event1',
				id: 'id1',
				blockHash: 'blockHash1',
				blockNumber: 1001,
				transactionHash: 'txHash1',
				type: 'type1'
			},
			logIndex: 0,
			transactionIndex: 0,
			transactionHash: 'txHash1',
			blockHash: 'blockHash1',
			blockNumber: 1001
		},
		event2: {
			event: 'event2',
			address: 'contract1',
			returnValues: {
				address: 'address2',
				event: 'event2',
				id: 'id2',
				blockHash: 'blockHash2',
				blockNumber: 1002,
				transactionHash: 'txHash2',
				type: 'type2'
			},
			logIndex: 0,
			transactionIndex: 0,
			transactionHash: 'txHash2',
			blockHash: 'blockHash2',
			blockNumber: 1002
		}
	},
	contract2: {
		event1: {
			event: 'event1',
			address: 'contract2',
			returnValues: {
				address: 'address1',
				event: 'event1',
				id: 'id3',
				blockHash: 'blockHash3',
				blockNumber: 1003,
				transactionHash: 'txHash3',
				type: 'type3'
			},
			logIndex: 0,
			transactionIndex: 0,
			transactionHash: 'txHash3',
			blockHash: 'blockHash3',
			blockNumber: 1003
		},
		event2: {
			event: 'event1',
			address: 'contract2',
			returnValues: {
				address: 'address1',
				event: 'event1',
				id: 'id4',
				blockHash: 'blockHash4',
				blockNumber: 1004,
				transactionHash: 'txHash4',
				type: 'type4'
			},
			logIndex: 0,
			transactionIndex: 0,
			transactionHash: 'txHash4',
			blockHash: 'blockHash4',
			blockNumber: 1004
		}
	}
};

const parsedEvents: { [txHash: string]: object } = {
	txHash1: {
		contractAddress: 'contractAddress1',
		type: 'type1',
		id: 'id1',
		blockHash: 'blockHash1',
		blockNumber: 1001,
		transactionHash: 'txHash1',
		logStatus: 'mined',
		parameters: {},
		timestamp: 1234567890
	},
	txHash2: {
		contractAddress: 'contractAddress2',
		type: 'type2',
		id: 'id2',
		blockHash: 'blockHash2',
		blockNumber: 1002,
		transactionHash: 'txHash2',
		logStatus: 'mined',
		parameters: {},
		timestamp: 1234567890
	},
	txHash3: {
		contractAddress: 'contractAddress3',
		type: 'type3',
		id: 'id3',
		blockHash: 'blockHash3',
		blockNumber: 1003,
		transactionHash: 'txHash3',
		logStatus: 'mined',
		parameters: {},
		timestamp: 1234567890
	},
	txHash4: {
		contractAddress: 'contractAddress4',
		type: 'type4',
		id: 'id4',
		blockHash: 'blockHash4',
		blockNumber: 1004,
		transactionHash: 'txHash4',
		logStatus: 'mined',
		parameters: {},
		timestamp: 1234567890
	}
};

test('fetch,', async () => {
	const baseContractWrappers = [
		{
			web3Wrapper: {
				inceptionBlockNumber: 900,
				getCurrentBlockNumber: jest.fn(() => Promise.resolve(1050)),
				getBlockTimestamp: jest.fn((blkNum: number) => Promise.resolve(1234567 * blkNum))
			},
			events: ['event1', 'event2'],
			contract: 'contract1'
		} as any,
		{
			web3Wrapper: {
				inceptionBlockNumber: 900,
				getCurrentBlockNumber: jest.fn(() => Promise.resolve(1050))
			},
			events: ['event1', 'event2'],
			contract: 'contract2'
		} as any
	];

	dynamoUtil.readLastBlock = jest.fn(() => Promise.resolve(999));

	global.setInterval = jest.fn();

	Web3Wrapper.pullEvents = jest.fn((contract, start, end, event) => {
		console.log(start, end);
		return Promise.resolve([contractEvents[contract][event]]);
	});

	Web3Wrapper.parseEvent = jest.fn(el => parsedEvents[el.transactionHash]);

	dynamoUtil.insertEventsData = jest.fn(() => Promise.resolve({}));
	dynamoUtil.insertHeartbeat = jest.fn(() => Promise.resolve());
	await eventUtil.fetch(baseContractWrappers, true);

	expect((Web3Wrapper.parseEvent as jest.Mock).mock.calls).toMatchSnapshot();
});
