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
 * @returns A promise that resolves to an array of place predictions.
 * @throws Will throw an error if the function invocation fails.
 */
export async function getPlacePredictions(
  input: string,
  sessionToken: string,
): Promise<Prediction[]> {
  console.log(`[SearchService] Invoking 'search-places' for: "${input}"`);
  console.log(`[SearchService] Session Token:`, sessionToken);

  const { data, error } = await supabase.functions.invoke("search-places", {
    body: { input, sessionToken },
  });

  if (error) {
    console.error(`[SearchService] Supabase Invoke Error:`, error);
    // Log the raw response if it exists attached to the error
    if ((error as any).context) {
      console.error(`[SearchService] Error Context:`, (error as any).context);
    }
    throw error;
  }

  console.log(`[SearchService] Success! Received data:`, data);
  return data || [];
}
