import { supabase } from './supabase';

/**
 * Represents a geographic bounding box for map-based queries.
 */
interface BoundingBox {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

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

/**
 * Triggers the Supabase Edge Function to ingest restaurants for a given area.
 * @param bbox The geographic bounding box to scan.
 * @throws Will throw an error if the function invocation fails.
 */
export async function triggerIngest(bbox: BoundingBox) {
  const { data, error } = await supabase.functions.invoke('ingest-restaurants', {
    body: { bbox },
  });

  if (error) {
    throw error;
  }

  return data;
}
