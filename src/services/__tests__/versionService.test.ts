import { getAppVersionConfig } from '../versionService';
import { supabase } from '../supabase';

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('versionService', () => {
  const mockSupabase = (
    data: { min_required_version: string; download_url: string | null } | null,
    error: Error | null = null,
  ) => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data, error }),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns isSupported: true when version meets min requirement', async () => {
    mockSupabase({
      min_required_version: '1.0.0',
      download_url: 'https://example.com/app.apk',
    });

    const result = await getAppVersionConfig();
    expect(result).toEqual({
      isSupported: true,
      downloadUrl: 'https://example.com/app.apk',
    });
  });

  it('returns isSupported: false when version is below min requirement', async () => {
    mockSupabase({
      min_required_version: '99.0.0',
      download_url: 'https://example.com/app.apk',
    });

    const result = await getAppVersionConfig();
    expect(result).toEqual({
      isSupported: false,
      downloadUrl: 'https://example.com/app.apk',
    });
  });

  it('fails open (isSupported: true) when Supabase returns an error', async () => {
    mockSupabase(null, new Error('Network error'));

    const result = await getAppVersionConfig();
    expect(result).toEqual({
      isSupported: true,
      downloadUrl: null,
    });
  });
});
