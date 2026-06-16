import { supabase } from "./supabase";

/**
 * Interface representing a search prediction from Google Places.
 */
export interface Prediction {
  description: string;
  placeId: string;
}

/**
 * Retrieves autocomplete predictions for place searches.
 * @param input The user's search query string.
 * @param sessionToken A unique token to group search requests for billing.
 * @param location Optional user coordinates to bias search results.
 * @returns A promise that resolves to an array of place predictions.
 * @throws Will throw an error if the function invocation fails.
 */
export async function getPlacePredictions(
  input: string,
  sessionToken: string,
  location?: { latitude: number; longitude: number },
): Promise<Prediction[]> {
  console.log(`[SearchService] Invoking 'search-places' for: "${input}"`);
  console.log(`[SearchService] Session Token:`, sessionToken);

  const { data, error } = await supabase.functions.invoke("search-places", {
    body: { input, sessionToken, location },
  });

  if (error) {
    console.error(`[SearchService] Supabase Invoke Error:`, error);
    if ((error as Record<string, unknown>).context) {
      console.error(
        `[SearchService] Error Context:`,
        (error as Record<string, unknown>).context,
      );
    }
    throw error;
  }

  console.log(`[SearchService] Success! Received data:`, data);
  return data || [];
}
