import { register, login } from '../authService';
import { supabase } from '../supabase';

jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
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

      await register('test@example.com', 'reallySecurePassword123', 'TestUser');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'reallySecurePassword123',
        options: {
          data: {
            display_name: 'TestUser',
          },
        },
      });
    });

    it('throws an error if supabase.auth.signUp fails', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Registration failed'),
      });

      await expect(
        register('test@example.com', 'reallySecurePassword123', 'TestUser'),
      ).rejects.toThrow('Registration failed');
    });
  });
});

describe('Login test', () => {
  it('calls supabase.auth.signInWithPassword with correct credentials', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: { id: '123' }, session: { access_token: 'abc' } },
      error: null,
    });

    await login('test@example.com', 'securePassword123');

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'securePassword123',
    });
  });

  it('throws an error if supabase.auth.signInWithPassword fails', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('Invalid login credentials'),
    });

    await expect(
      login('test@example.com', 'securePassword123'),
    ).rejects.toThrow('Invalid login credentials');
  });
});
