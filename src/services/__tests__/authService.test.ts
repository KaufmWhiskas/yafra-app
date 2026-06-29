import {
  fetchUserProfile,
  sendPasswordResetOtp,
  updateProfileAvatar,
  updateUsername,
  updateUserPassword,
  uploadAvatar,
  verifyResetOtp,
} from '../authService';
import { supabase } from '../supabase';
import * as FileSystem from 'expo-file-system';

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
}));

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    auth: {
      resetPasswordForEmail: jest.fn(),
      verifyOtp: jest.fn(),
      updateUser: jest.fn(),
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      }),
    },
    storage: {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
    },
  },
}));

describe('Auth Service - User Profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserProfile', () => {
    it('selects the profile for the given user ID', async () => {
      // @ts-expect-error: custom mock property not on root client
      (supabase.single as jest.Mock).mockResolvedValueOnce({
        data: { id: '123', username: 'testuser' },
        error: null,
      });

      const result = await fetchUserProfile('123');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(result).toEqual({ id: '123', username: 'testuser' });
    });
  });

  describe('updateUsername', () => {
    it('updates the username for the given user ID', async () => {
      // @ts-expect-error: custom mock property not on root client
      (supabase.single as jest.Mock).mockResolvedValueOnce({
        data: { id: '123', username: 'newname' },
        error: null,
      });

      const result = await updateUsername('123', 'newname');

      // @ts-expect-error: custom mock property not on root client
      expect(supabase.update).toHaveBeenCalledWith({ username: 'newname' });
      expect(result).toEqual({ id: '123', username: 'newname' });
    });
  });
  describe('uploadAvatar', () => {
    it('uploads the file and returns the public URL', async () => {
      const fileUri = 'file:///test/avatar.jpg';
      const userId = '123'; // From the getUser mock
      const publicUrl = `https://<project>.supabase.co/storage/v1/object/public/avatars/${userId}/avatar.jpg`;

      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
        'base64string',
      );
      // @ts-expect-error: custom mock property not on root client
      (supabase.storage.upload as jest.Mock).mockResolvedValue({ error: null });
      // @ts-expect-error: custom mock property not on root client
      (supabase.storage.getPublicUrl as jest.Mock).mockReturnValue({
        data: { publicUrl },
      });

      const result = await uploadAvatar(fileUri);

      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(fileUri, {
        encoding: 'base64',
      });
      expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.storage.upload).toHaveBeenCalledWith(
        `${userId}/avatar.jpg`,
        expect.any(ArrayBuffer),
        { contentType: 'image/jpeg', upsert: true },
      );
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.storage.getPublicUrl).toHaveBeenCalledWith(
        `${userId}/avatar.jpg`,
      );
      expect(result).toBe(publicUrl);
    });
  });

  describe('updateProfileAvatar', () => {
    it('updates the avatar_url in the user profile', async () => {
      const userId = '123'; // From the getUser mock
      const avatarUrl = 'http://example.com/avatar.jpg';
      // @ts-expect-error: custom mock property not on root client
      (supabase.single as jest.Mock).mockResolvedValueOnce({
        data: {},
        error: null,
      });
      await updateProfileAvatar(avatarUrl);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.update).toHaveBeenCalledWith({ avatar_url: avatarUrl });
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.eq).toHaveBeenCalledWith('id', userId);
    });
  });
});

describe('Auth Service - Password Reset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPasswordResetOtp', () => {
    it('calls supabase.auth.resetPasswordForEmail with the correct parameters', async () => {
      const email = 'test@example.com';
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValueOnce({
        data: {},
        error: null,
      });

      await sendPasswordResetOtp(email);

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
        redirectTo: undefined,
      });
    });

    it('throws an error if supabase returns an error', async () => {
      const errorMessage = 'Unable to send reset email';
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValueOnce({
        data: {},
        error: new Error(errorMessage),
      });

      await expect(sendPasswordResetOtp('test@example.com')).rejects.toThrow(
        errorMessage,
      );
    });
  });

  describe('verifyResetOtp', () => {
    it('calls supabase.auth.verifyOtp with the correct parameters', async () => {
      const email = 'test@example.com';
      const token = '123456';
      (supabase.auth.verifyOtp as jest.Mock).mockResolvedValueOnce({
        data: {},
        error: null,
      });

      await verifyResetOtp(email, token);

      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        email,
        token,
        type: 'recovery',
      });
    });
  });

  describe('updateUserPassword', () => {
    it('calls supabase.auth.updateUser with the new password', async () => {
      const newPassword = 'newSecurePassword123';
      (supabase.auth.updateUser as jest.Mock).mockResolvedValueOnce({
        data: {},
        error: null,
      });

      await updateUserPassword(newPassword);

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      });
    });
  });
});
