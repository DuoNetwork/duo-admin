import { kovan } from '../../../duo-contract-wrapper/src/contractAddresses';
import BaseService from './BaseService';
jest.mock('../../../duo-contract-wrapper/src/Web3Wrapper', () =>
	jest.fn(() => ({
		contractAddresses: kovan
	}))
);
jest.mock('../../../duo-contract-wrapper/src/DualClassWrapper', () =>
	jest.fn(() => ({
		contract: 'dualClassWrapper'
	}))
);
jest.mock('../../../duo-contract-wrapper/src/EsplanadeWrapper', () =>
	jest.fn(() => ({
		contract: 'EsplanadeWrapper'
	}))
);
jest.mock('../../../duo-contract-wrapper/src/MagiWrapper', () =>
	jest.fn(() => ({
		contract: 'MagiWrapper'
	}))
);

const service = new BaseService('tool', {
	live: false,
	provider: 'provider'
} as any);

test('createDuoWrappers', () => {
	expect(service.createDuoWrappers()).toMatchSnapshot();
});

test('createMagiWrapper', () => {
	expect(service.createMagiWrapper()).toMatchSnapshot();
});

test('createEsplanadeWrapper', () => {
	expect(service.createEsplanadeWrapper()).toMatchSnapshot();
});
