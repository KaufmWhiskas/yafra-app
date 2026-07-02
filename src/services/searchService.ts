import { supabase } from './supabase';
import { Prediction, SearchRequest } from '../types';

/**
 * Retrieves autocomplete predictions for place searches.
 * @param request The search request object, containing the query and optional coordinates.
 * @param sessionToken A unique token to group search requests for billing.
 * @returns A promise that resolves to an array of place predictions.
 * @throws Will throw an error if the function invocation fails.
 */
export async function getPlacePredictions(
  request: SearchRequest,
  sessionToken: string,
): Promise<Prediction[]> {
  try {
    const payload: {
      input: string;
      sessionToken: string;
      location?: { latitude: number; longitude: number };
    } = {
      input: request.query,
      sessionToken,
    };

    if (request.latitude != null && request.longitude != null) {
      payload.location = {
        latitude: request.latitude,
        longitude: request.longitude,
      };
    }

    const { data, error } = await supabase.functions.invoke('search-places', {
      body: payload,
    });

    if (error) throw new Error(error.message);

    return data || [];
  } catch (err) {
    console.error('[SearchService] Error:', err);
    throw err;
  }
}
