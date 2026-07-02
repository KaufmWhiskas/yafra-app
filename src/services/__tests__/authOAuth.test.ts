import { signInWithProvider } from '../authService';
import { supabase } from '../supabase';
import * as WebBrowser from 'expo-web-browser';

jest.mock('../supabase');
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(({ scheme }) => `${scheme}://auth-callback`),
}));
jest.mock('expo-web-browser');

describe('OAuth Service Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve session successfully when WebBrowser returns tokens', async () => {
    const mockOAuthUrl = 'https://supabase.co/auth/v1/authorize';
    (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
      data: { url: mockOAuthUrl },
      error: null,
    });

    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
      type: 'success',
      url: 'yafra://auth-callback#access_token=test_access&refresh_token=test_refresh',
    });

    (supabase.auth.setSession as jest.Mock).mockResolvedValueOnce({
      data: { session: { user: { id: '123' } } },
      error: null,
    });

    const session = await signInWithProvider('google');
    expect(session).toBeDefined();
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({ skipBrowserRedirect: true }),
    });
    expect(supabase.auth.setSession).toHaveBeenCalledWith({
      access_token: 'test_access',
      refresh_token: 'test_refresh',
    });
  });
});
