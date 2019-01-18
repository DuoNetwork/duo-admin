import osUtil from './osUtil';

jest.mock('os', () => ({
	hostname: () => 'hostname'
}));

test('getHostName', () => {
	expect(osUtil.getHostName()).toBe('hostname');
});
