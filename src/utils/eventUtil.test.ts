// import eventUtil from  './eventUtil';

jest.mock('../../../duo-contract-wrapper/src/DualClassWrapper', () =>
	jest.fn(() => ({
		contract: 'dualClassWrapper'
	}))
);
test('test', () => expect(true).toBeTruthy());

// test('trigger', () => {
// 	const dualClassWrapper = {
// 		address: 'contractAddress',
// 		getStates: jest.fn(() =>Promise.resolve({
// 			state: 'state'
// 		})),
// 		triggerPreReset: jest.fn()

// 	}
// })
