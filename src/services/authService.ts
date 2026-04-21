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
