import { OpenCodeClient } from '../src/services/opencode-client';
import { PluginSettings } from '../src/models/types';
import ky from 'ky';

jest.mock('ky');
const mockedKy = ky as jest.Mocked<typeof ky>;

describe('OpenCodeClient', () => {
	let client: OpenCodeClient;
	let settings: PluginSettings;
	let mockHttp: jest.MockedFunction<ReturnType<typeof ky.create>>;

	beforeEach(() => {
		settings = {
			apiEndpoint: 'https://api.test.com',
			apiKey: 'test-key',
			debounceInterval: 5000,
			maxHistoryLength: 100,
		};

		mockHttp = jest.fn().mockReturnThis();
		mockedKy.create = jest.fn().mockReturnValue(mockHttp as unknown as ReturnType<typeof ky.create>);

		client.client = new OpenCodeClient(settings);
	});

	test('should create an instance with correct settings', () => {
		expect(mockedKy.create).toHaveBeenCalledWith({
			prefixUrl: settings.apiEndpoint,
			headers: {
				Authorization: `Bearer ${settings.apiKey}`,
				'Content-Type': 'application/json',
			},
		});
	});

	test('healthCheck should return true on success', async () => {
		mockHttp.mockResolvedValueOnce({} as never);

		const result = await client.healthCheck();
		expect(result).toBe(true);
	});

	test('healthCheck should return false on error', async () => {
		mockHttp = jest.fn().mockRejectedValue(new Error('Network error'));
		mockedKy.create = jest.fn().mockReturnValue(mockHttp as unknown as ReturnType<typeof ky.create>);

		const result = await client.healthCheck();
		expect(result).toBe(false);
	});
});