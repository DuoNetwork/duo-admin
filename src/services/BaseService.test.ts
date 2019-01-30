import { kovan } from '@finbook/duo-contract-wrapper/dist/contractAddresses';
import BaseService from './BaseService';

jest.mock('@finbook/duo-contract-wrapper', () => ({
	Web3Wrapper: jest.fn(() => ({
		contractAddresses: kovan
	})),
	DualClassWrapper: jest.fn(() => ({
		contract: 'dualClassWrapper'
	})),
	EsplanadeWrapper: jest.fn(() => ({
		contract: 'EsplanadeWrapper'
	})),
	MagiWrapper: jest.fn(() => ({
		contract: 'MagiWrapper'
	}))
}));

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
