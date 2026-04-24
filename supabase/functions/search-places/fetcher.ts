export interface Prediction {
  description: string;
  placeId: string;
}

interface GoogleSuggestion {
  placePrediction: {
    place: string;
    text: {
      text: string;
    };
  };
}

/**
 * Fetches place autocomplete predictions from Google Places API (New).
 * Uses a session token to group requests into a single billable event.
 */
export async function fetchPredictions(
  input: string,
  sessionToken: string,
  apiKey: string,
): Promise<Prediction[]> {
  const url = "https://places.googleapis.com/v1/places:autocomplete";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({
      input,
      sessionToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Map the Autocomplete (New) response structure to our Prediction interface
  return (data.suggestions || []).map((suggestion: GoogleSuggestion) => ({
    description: suggestion.placePrediction.text.text,
    placeId: suggestion.placePrediction.place,
  }));
}

export async function fetchProDetails(placeId: string, apiKey: string) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      // Added 'location' to the Field Mask
      "X-Goog-FieldMask":
        "rating,priceLevel,regularOpeningHours,reviews,location",
    },
  });
  return response.json();
}
