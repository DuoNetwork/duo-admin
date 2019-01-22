// import dynamoUtil from './dynamoUtil';
// import eventUtil from './eventUtil';

jest.mock('../../../duo-contract-wrapper/src/DualClassWrapper', () =>
	jest.fn(() => ({
		contract: 'dualClassWrapper'
	}))
);
test('test', () => expect(true).toBeTruthy());

// test('trigger, worng event name', async () => {
// 	dynamoUtil.insertHeartbeat = jest.fn();
// 	global.setInterval = jest.fn();
// 	const dualClassWrapper = {
// 		address: 'contractAddress',
// 		getStates: jest.fn(() =>
// 			Promise.resolve({
// 				state: 'state'
// 			})
// 		),
// 		triggerPreReset: jest.fn(),
// 		triggerReset: jest.fn()
// 	} as any;
// 	await eventUtil.trigger('account', [dualClassWrapper], 'event');
// 	expect(global.setInterval as jest.Mock).not.toBeCalled();
// 	expect(dynamoUtil.insertHeartbeat as jest.Mock).not.toBeCalled();
// });

// test('trigger, StartPreReset', async () => {
// 	dynamoUtil.insertHeartbeat = jest.fn();
// 	global.setInterval = jest.fn();
// 	const dualClassWrappers = [
// 		{
// 			address: 'contractAddress1',
// 			getStates: jest.fn(() =>
// 				Promise.resolve({
// 					state: 'StartPreReset'
// 				})
// 			),
// 			triggerPreReset: jest.fn(),
// 			triggerReset: jest.fn()
// 		} as any,
// 		{
// 			address: 'contractAddress2',
// 			getStates: jest.fn(() =>
// 				Promise.resolve({
// 					state: 'StartPreReset'
// 				})
// 			),
// 			triggerPreReset: jest.fn(),
// 			triggerReset: jest.fn()
// 		} as any
// 	];
// 	await eventUtil.trigger('account', dualClassWrappers, 'StartPreReset');
// 	expect((global.setInterval as jest.Mock).mock.calls[0][1]).toMatchSnapshot();
// 	await (global.setInterval as jest.Mock).mock.calls[0][0]();

// 	// for (const dcw of dualClassWrappers) {
// 	// 	expect(dcw.getStates as jest.Mock).toBeCalledTimes(1);
// 	// 	expect((dcw.triggerPreReset as jest.Mock).mock.calls).toMatchSnapshot();
// 	// 	expect(dcw.triggerReset as jest.Mock).not.toBeCalled();
// 	// 	expect(dynamoUtil.insertHeartbeat as jest.Mock).toBeCalledTimes(1);
// 	// }
// });
