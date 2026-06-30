import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy'; // Use the LEGACY import as requested
import { decode } from 'base64-arraybuffer';

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
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

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

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUsername(userId: string, username: string) {
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

export async function sendPasswordResetOtp(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: undefined, // We are not using a redirect URL for native app flow
  });

  if (error) {
    throw new Error(error.message);
  }
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

    return data.publicUrl;
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

export async function updateUserPassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error(error.message);
  }
}
