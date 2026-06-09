import { supabase } from './supabase';

/**
 * Registers a new user with the backend authentication provider.
 *
 * @param email - Users email address
 * @param password - Users chosen password
 * @param displayName - Users display name for their profile
 * @returns - The authentication data including user and session details.
 * @throws Will throw an error if the registration fails (e.g., email already in use)
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
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Authenticates an existing user with the backend provider.
 * @param email - The users registered email address.
 * @param password - The users password.
 * @returns The authentication data including user and session details.
 * @throws Will throw an error if authentication fails (e.g., invalid credentials).
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
 * Logs out the currently authenticated user.
 * @throws Will throw an error if the logout fails.
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

/**
 * Fetches the user's profile information from the profiles table.
 * @param userId - The UUID of the authenticated user.
 * @returns The user's profile data.
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
 * Updates the user's username in the profiles table.
 * @param userId - The UUID of the authenticated user.
 * @param username - The new username.
 * @returns The updated profile data.
 */
export async function updateUsername(userId: string, username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
