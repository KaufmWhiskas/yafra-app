import { supabase } from './supabase';

/**
 * Fetches all restaurants from the database.
 * @returns A promise resolving to an array of restaurant records.
 * @throws Will throw an error if the database query fails.
 */
export async function fetchRestaurants() {
  const { data, error } = await supabase.from('restaurants').select('*');

  if (error) {
    throw error;
  }

  return data;
}
