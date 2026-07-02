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
    const { data, error } = await supabase.functions.invoke('search-places', {
      body: {
        input: request.query,
        sessionToken,
        location:
          request.latitude && request.longitude
            ? { latitude: request.latitude, longitude: request.longitude }
            : undefined,
      },
    });

    if (error) throw new Error(error.message);

    return data || [];
  } catch (err) {
    console.error('[SearchService] Error:', err);
    throw err;
  }
}
