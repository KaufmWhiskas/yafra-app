import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Session } from '@supabase/supabase-js';

/**
 * Registers a new user with the application.
 * @param email The user's email address.
 * @param password The user's chosen password (must be at least 6 characters).
 * @param displayName The user's public display name.
 * @returns A promise that resolves with the user and session data upon successful registration.
 * @throws Will throw an error if the registration fails (e.g., email already in use).
 */
export async function register(
  email: string,
  password: string,
  displayName: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        username: displayName,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Authenticates an existing user with their email and password.
 * @param email The user's email address.
 * @param password The user's password.
 * @returns A promise that resolves with the user and session data upon successful login.
 * @throws Will throw an error if the login fails (e.g., invalid credentials).
 */
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Signs out the currently authenticated user.
 * @throws Will throw an error if the sign-out process fails.
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

/**
 * Fetches the public profile for a given user.
 * @param userId The ID of the user whose profile is to be fetched.
 * @returns A promise that resolves with the user's profile data.
 * @throws Will throw an error if the user is not found or the query fails.
 */
export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Updates the username for the currently authenticated user.
 * @param username The new username for the user.
 * @returns A promise that resolves with the updated profile data.
 * @throws Will throw an error if authentication fails or the update operation fails.
 */
export async function updateUsername(username: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Authentication required');

  const { data, error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Sends a password reset one-time password (OTP) to the specified email address.
 * @param email The email address to send the reset link to.
 * @throws Will throw an error if the OTP cannot be sent.
 */
export async function sendPasswordResetOtp(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: undefined, // We are not using a redirect URL for native app flow
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Handles browser-based OAuth authentication for third-party providers.
 * Generates an internal PKCE handshake verification challenge, loads the provider portal,
 * and passes returning deep-link credentials back into the main active state container.
 *
 * @param provider Target authorization source (e.g., 'google', 'discord').
 * @returns A promise resolving to the active authentication session, or null if cancelled.
 */
export async function signInWithProvider(
  provider: 'google' | 'discord',
): Promise<Session | null> {
  const redirectTo = makeRedirectUri({ scheme: 'yafra' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url)
    throw error || new Error('OAuth URL generation failed');

  const authResult = await WebBrowser.openAuthSessionAsync(
    data.url,
    redirectTo,
  );

  if (authResult.type === 'success' && authResult.url) {
    // Parse the fragment parameters securely from the custom schema string
    const urlObj = new URL(authResult.url.replace('#', '?'));
    const access_token = urlObj.searchParams.get('access_token');
    const refresh_token = urlObj.searchParams.get('refresh_token');

    if (!access_token || !refresh_token) {
      throw new Error(
        'Authentication parameters missing from redirect payload',
      );
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

    if (sessionError) throw sessionError;
    return sessionData.session;
  }

  return null;
}

/**
 * Uploads a new user avatar, overwriting any existing one.
 * Relies strictly on verified session tokens for security.
 * @param fileUri The local URI of the compressed image file.
 * @returns The public URL of the uploaded avatar.
 */
export async function uploadAvatar(fileUri: string): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Authentication required');

  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64', // Keep as string literal to avoid type issues
    });

    const arrayBuffer = decode(base64);

    const filePath = `${user.id}/avatar.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    if (!data.publicUrl)
      throw new Error('Could not get public URL for avatar.');

    // Strip the cache-busting `t` query parameter before returning.
    // This ensures a clean, permanent URL is stored in the database.
    return data.publicUrl.split('?')[0];
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

/**
 * Updates the user's profile with a new avatar URL using session checking.
 * @param avatarUrl The new public URL of the avatar.
 */
export async function updateProfileAvatar(avatarUrl: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Authentication required');

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id) // Enforce verified session identity constraint
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Verifies a password reset OTP for a given email.
 * @param email The user's email address.
 * @param token The OTP received by the user.
 * @throws Will throw an error if the OTP is invalid or expired.
 */
export async function verifyResetOtp(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  });
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Updates the password for the currently authenticated user.
 * This should only be called after a user has successfully verified a password reset OTP.
 * @param newPassword The new password for the user.
 * @throws Will throw an error if the password update fails.
 */
export async function updateUserPassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error(error.message);
  }
}
