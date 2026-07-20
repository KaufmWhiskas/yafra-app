import { checkVersionIsSupported } from '../versionService';
import { supabase } from '../supabase';
import { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';

jest.mock('../supabase');

const mockedSupabase = supabase as jest.Mocked<typeof supabase>;

// Define mocks for the chained methods
const mockSingle = jest.fn<Promise<PostgrestSingleResponse<AppConfig>>, []>();
const mockOrder = jest.fn().mockReturnValue({ single: mockSingle });
const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });

interface AppConfig {
  min_required_version: string;
  download_url: string;
}

describe('versionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockedSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });
  });

  it('should return true if app version is greater than min_required_version', async () => {
    const mockResponse: PostgrestSingleResponse<AppConfig> = {
      data: {
        min_required_version: '1.0.0',
        download_url: 'https://yafra.app',
      },
      error: null,
      status: 200,
      statusText: 'OK',
      count: null,
      success: true,
    };
    mockSingle.mockResolvedValueOnce(mockResponse);

    const isSupported = await checkVersionIsSupported('1.1.0');
    expect(isSupported).toBe(true);

    expect(mockedSupabase.from).toHaveBeenCalledWith('app_config');
    expect(mockSelect).toHaveBeenCalledWith(
      'min_required_version, download_url',
    );
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should return true if app version is equal to min_required_version', async () => {
    const mockResponse: PostgrestSingleResponse<AppConfig> = {
      data: {
        min_required_version: '1.2.3',
        download_url: 'https://yafra.app',
      },
      error: null,
      status: 200,
      statusText: 'OK',
      count: null,
      success: true,
    };
    mockSingle.mockResolvedValueOnce(mockResponse);

    const isSupported = await checkVersionIsSupported('1.2.3');
    expect(isSupported).toBe(true);
  });

  it('should return false if app version major is less than min_required_version', async () => {
    const mockResponse: PostgrestSingleResponse<AppConfig> = {
      data: {
        min_required_version: '2.0.0',
        download_url: 'https://yafra.app',
      },
      error: null,
      status: 200,
      statusText: 'OK',
      count: null,
      success: true,
    };
    mockSingle.mockResolvedValueOnce(mockResponse);

    const isSupported = await checkVersionIsSupported('1.9.9');
    expect(isSupported).toBe(false);
  });

  it('should return false if app version minor is less than min_required_version', async () => {
    const mockResponse: PostgrestSingleResponse<AppConfig> = {
      data: {
        min_required_version: '1.2.0',
        download_url: 'https://yafra.app',
      },
      error: null,
      status: 200,
      statusText: 'OK',
      count: null,
      success: true,
    };
    mockSingle.mockResolvedValueOnce(mockResponse);

    const isSupported = await checkVersionIsSupported('1.1.9');
    expect(isSupported).toBe(false);
  });

  it('should return false if app version patch is less than min_required_version', async () => {
    const mockResponse: PostgrestSingleResponse<AppConfig> = {
      data: {
        min_required_version: '1.2.3',
        download_url: 'https://yafra.app',
      },
      error: null,
      status: 200,
      statusText: 'OK',
      count: null,
      success: true,
    };
    mockSingle.mockResolvedValueOnce(mockResponse);

    const isSupported = await checkVersionIsSupported('1.2.2');
    expect(isSupported).toBe(false);
  });

  it('should return true if remote config is missing (fail-open)', async () => {
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const mockResponse: PostgrestSingleResponse<AppConfig> = {
      data: null,
      error: {
        message: 'JSON object requested, but 0 rows returned',
        details: 'Results contain 0 rows, but 1 was expected',
        hint: '',
        code: 'PGRST116',
      } as PostgrestError,
      status: 406,
      statusText: 'Not Acceptable',
      count: null,
      success: false,
    };
    mockSingle.mockResolvedValueOnce(mockResponse);

    const isSupported = await checkVersionIsSupported('1.0.0');
    expect(isSupported).toBe(true);
    consoleWarnSpy.mockRestore();
  });

  it('should return true on database error (fail-open)', async () => {
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const mockResponse: PostgrestSingleResponse<AppConfig> = {
      data: null,
      error: {
        message: 'DB connection failed',
        details: '',
        hint: '',
        code: '500',
      } as PostgrestError,
      status: 500,
      statusText: 'Internal Server Error',
      count: null,
      success: false,
    };
    mockSingle.mockResolvedValueOnce(mockResponse);

    const isSupported = await checkVersionIsSupported('1.0.0');
    expect(isSupported).toBe(true);
    consoleWarnSpy.mockRestore();
  });
});
