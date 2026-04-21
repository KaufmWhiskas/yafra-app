import { register } from '../authService';
import { supabase } from '../supabase';

jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
    },
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Register', () => {
    it('calls supabase.auth.signUp with correct credentials', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: '123',
          },
          session: null,
        },
        error: null,
      });

      await register('test@example.com', 'reallySecurePassword123');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'reallySecurePassword123',
      });
    });

    it('throws an error if supabase.auth.signUp fails', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Registration failed'),
      });

      await expect(
        register('test@example.com', 'reallySecurePassword123'),
      ).rejects.toThrow('Registration failed');
    });
  });
});
